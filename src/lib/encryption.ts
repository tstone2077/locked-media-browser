
import { useSessionStorage } from "./session-storage";

export type EncryptionMethodConfig = {
  name: string;
  type: "gpg";
  privateKey: string;
  password: string;
};

const ENCRYPTION_KEY = "encryption-methods";

export function useEncryptionMethods() {
  const [methods, setMethods] = useSessionStorage<EncryptionMethodConfig[]>(ENCRYPTION_KEY, []);

  function addMethod(config: EncryptionMethodConfig) {
    setMethods([...methods, config]);
  }
  function removeMethod(index: number) {
    setMethods(methods.filter((_, idx) => idx !== index));
  }

  // methods as pseudo-pluggable for abstraction
  return {
    methods,
    addMethod,
    removeMethod,
  };
}
