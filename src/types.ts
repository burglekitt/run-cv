export interface MenuItem {
  label: string;
  file?: string;
  theme?: string;
}

export interface Page {
  content: string;
  menu: MenuItem[];
  dir: string;
  file?: string;
}

export interface HighlightedItem {
  label: string;
  value: string;
}

export interface HumanManifest extends Page {
  name: string;
  role: string;
  skills?: string[]; // parsed from frontmatter comma-separated list
}
