
export type OpenDriveSourceConfig = {
  name: string;
  type: "opendrive";
  encryption: string;
  username?: string;
  password?: string;
  rootFolder?: string;
};
