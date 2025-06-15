
export type AES256Config = {
  name: string;
  type: "aes-256";
  password: string;
};

export const AES256Method = {
  type: "aes-256" as const,
  label: "AES-256",
  defaultConfig: (): AES256Config => ({
    name: "",
    type: "aes-256",
    password: "",
  }),
};
