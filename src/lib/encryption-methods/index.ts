
export * from "./types";
export * from "./GPGMethod";
export * from "./AES256Method";
export * from "./MethodFactory";

// Legacy exports for backward compatibility
export { GPGMethod as GPGConfig } from "./GPGMethod";
export { AES256Method as AES256Config } from "./AES256Method";

export const ENCRYPTION_METHODS = ["gpg", "aes-256"] as const;
