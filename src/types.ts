export interface MenuItem {
  label: string;
  file: string;
}

export interface Page {
  content: string;
  menu: MenuItem[];
  dir: string;
  file?: string;
}

export interface HumanManifest extends Page {
  name: string;
  role: string;
}
