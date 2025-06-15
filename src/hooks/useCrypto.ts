/**
 * Hook that provides encrypt/decrypt file utilities using native Web Crypto API
 * Uses AES-GCM for simplicity, base64 for output
 */
import { useState } from "react";

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

function randomIv() {
  return window.crypto.getRandomValues(new Uint8Array(12));
}
function base64FromBuf(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function bufFromBase64(base64: string) {
  // Defensive: only allow valid base64
  try {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  } catch (e) {
    console.error("[useCrypto] bufFromBase64: invalid base64!", base64);
    throw new Error("Invalid base64 encoding while decoding encrypted data.");
  }
}

export function useCrypto(passphrase: string) {
  const [progress, setProgress] = useState(0);

  async function getKey() {
    // Derive key from passphrase via PBKDF2
    const salt = TEXT_ENCODER.encode("filevault-static-salt"); // Replace for real use!
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      TEXT_ENCODER.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptData(raw: ArrayBuffer | string) {
    setProgress(0);
    try {
      const buf = typeof raw === "string" ? TEXT_ENCODER.encode(raw) : new Uint8Array(raw);
      const iv = randomIv();
      const key = await getKey();
      const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        buf
      );
      setProgress(100);
      return base64FromBuf(iv) + ":" + base64FromBuf(ciphertext);
    } catch (err) {
      console.error("[useCrypto] encryptData error", err); // DEBUG
      throw err;
    }
  }

  async function decryptData(cipher: string) {
    setProgress(0);
    try {
      if (!cipher || typeof cipher !== "string" || !cipher.includes(":")) {
        throw new Error("Encrypted value must be valid and contain ':' separator");
      }
      const [ivB64, ctB64] = cipher.split(":");
      if (!ivB64 || !ctB64) {
        throw new Error("Malformed encrypted value: missing iv or ciphertext");
      }
      const iv = bufFromBase64(ivB64);
      const ct = bufFromBase64(ctB64);
      const key = await getKey();
      let decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ct
      );
      setProgress(100);
      return decrypted;
    } catch (err) {
      console.error("[useCrypto] decryptData error", err, cipher); // DEBUG
      throw err;
    }
  }

  return {
    encryptData,
    decryptData,
    progress,
  };
}
