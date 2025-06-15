
import { useSessionStorage } from "./session-storage";
import { EncryptionMethodConfig } from "./encryption-methods";

const ENCRYPTION_KEY = "encryption-methods";

export function useEncryptionMethods() {
  const [methods, setMethods] = useSessionStorage<EncryptionMethodConfig[]>(ENCRYPTION_KEY, []);

  function addMethod(config: EncryptionMethodConfig) {
    setMethods([...methods, config]);
  }
  function removeMethod(index: number) {
    setMethods(methods.filter((_, idx) => idx !== index));
  }

  return {
    methods,
    addMethod,
    removeMethod,
  };
}
