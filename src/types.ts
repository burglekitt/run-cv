export interface MenuItem {
  label: string;
  file: string;
}

export interface HumanManifest {
  name: string;
  role: string;
  menu: MenuItem[];
  introContent: string;
  dir: string;
}
