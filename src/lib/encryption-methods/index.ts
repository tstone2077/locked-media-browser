
import { GPGConfig, GPGMethod } from "./gpg";
import { AES256Config, AES256Method } from "./aes256";

// ---- AGE encryption method definition ----
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
};
// ---- END "age" method definition ----

export type EncryptionMethodConfig = GPGConfig | AES256Config | AgeConfig;

export const ENCRYPTION_METHODS = [GPGMethod, AES256Method, AgeMethod];

// Use type-only exports for isolatedModules compatibility:
export type { GPGConfig } from "./gpg";
export type { AES256Config } from "./aes256";
export type { AgeConfig };
export { GPGMethod, AES256Method, AgeMethod };
