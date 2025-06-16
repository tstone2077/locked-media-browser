
import { IEncryptionMethod, EncryptionMethodConfig } from "./types";
import { GPGMethod } from "./GPGMethod";
import { AES256Method } from "./AES256Method";

export class MethodFactory {
  static create(config: EncryptionMethodConfig): IEncryptionMethod {
    switch (config.type) {
      case "gpg":
        return new GPGMethod(config);
      case "aes-256":
        return new AES256Method(config);
      default:
        throw new Error(`Unknown encryption method type: ${(config as any).type}`);
    }
  }
}
