
export type GPGConfig = {
  name: string;
  type: "gpg";
  privateKey: string;
  password: string;
};

export const GPGMethod = {
  type: "gpg" as const,
  label: "GPG",
  defaultConfig: (): GPGConfig => ({
    name: "",
    type: "gpg",
    privateKey: "",
    password: "",
  }),
};
