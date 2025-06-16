
import { useSessionStorage } from "./session-storage";
import { EncryptionMethodConfig, IEncryptionMethod } from "./encryption-methods/types";
import { MethodFactory } from "./encryption-methods/MethodFactory";

const ENCRYPTION_KEY = "encryption-methods";

export function useEncryptionMethods() {
  const [methodConfigs, setMethodConfigs] = useSessionStorage<EncryptionMethodConfig[]>(ENCRYPTION_KEY, []);

  // Convert configs to method instances
  const methods: IEncryptionMethod[] = methodConfigs.map(config => MethodFactory.create(config));

  function addMethod(config: EncryptionMethodConfig) {
    setMethodConfigs([...methodConfigs, config]);
  }
  
  function removeMethod(index: number) {
    setMethodConfigs(methodConfigs.filter((_, idx) => idx !== index));
  }

  function updateMethod(index: number, config: EncryptionMethodConfig) {
    setMethodConfigs(methodConfigs.map((m, idx) => idx === index ? config : m));
  }

  return {
    methods,
    methodConfigs,
    addMethod,
    removeMethod,
    updateMethod,
  };
}
