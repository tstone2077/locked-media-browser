
export type AgeConfig = {
  name: string;
  type: "age";
  password: string;
};

export const AgeMethod = {
  type: "age" as const,
  label: "age",
  defaultConfig: (): AgeConfig => ({
    name: "",
    type: "age",
    password: "",
  }),
  // Stub utility for demo: in real use, integrate JS age implementation (e.g., https://github.com/FiloSottile/age)
  encrypt: async (plaintext: string | ArrayBuffer, config: AgeConfig) => {
    // Simple base64 encoding as a placeholder. Replace with age encryption logic.
    if (typeof plaintext === "string") {
      return btoa(unescape(encodeURIComponent(plaintext)));
    } else {
      // ArrayBuffer to base64
      const binary = String.fromCharCode(...new Uint8Array(plaintext));
      return btoa(binary);
    }
  },
  decrypt: async (ciphertext: string, config: AgeConfig) => {
    // Simple base64 decoding placeholder. Replace with age decryption logic.
    try {
      const decoded = atob(ciphertext);
      // Assume UTF-8 string; real age output may differ.
      return decodeURIComponent(escape(decoded));
    } catch {
      return "";
    }
  },
};
