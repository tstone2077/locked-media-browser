
// Import configs and methods
import { GPGConfig, GPGMethod } from "./gpg";
import { AES256Config, AES256Method } from "./aes256";

// ---- NEW: AGE encryption method stub ----
export type AgeConfig = {
  name: string;
  type: "age";
  password: string;
};

export const AgeMethod = {
  type: "age",
  label: "age"
};
// ---- END "age" method stub ----

export type EncryptionMethodConfig = GPGConfig | AES256Config | AgeConfig;

export const ENCRYPTION_METHODS = [GPGMethod, AES256Method, AgeMethod];

// Use type-only exports for isolatedModules compatibility:
export type { GPGConfig, AES256Config, AgeConfig };
export { GPGMethod, AES256Method, AgeMethod };

