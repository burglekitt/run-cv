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

export interface JSONEntry {
  section: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

export interface JSONOutput {
  name: string;
  entries: JSONEntry[];
}

import type { Tokens } from "marked";

export type ListItemWithId = Omit<Tokens.ListItem, "tokens"> & {
	id: string;
	tokens: TokenWithId[];
};

import type { Token as MarkedToken } from "marked";

type GenericToken = Exclude<
	MarkedToken,
	| Tokens.Heading
	| Tokens.Paragraph
	| Tokens.List
	| Tokens.Strong
	| Tokens.Em
	| Tokens.Text
	| Tokens.Space
>;

export type TokenWithId =
	| (Omit<Tokens.Heading, "tokens"> & { id: string; tokens: TokenWithId[] })
	| (Omit<Tokens.Paragraph, "tokens"> & { id: string; tokens: TokenWithId[] })
	| (Omit<Tokens.List, "items"> & { id: string; items: ListItemWithId[] })
	| (Omit<Tokens.Strong, "tokens"> & { id: string; tokens: TokenWithId[] })
	| (Omit<Tokens.Em, "tokens"> & { id: string; tokens: TokenWithId[] })
	| (Tokens.Text & { id: string })
	| (Tokens.Space & { id: string })
	| (GenericToken & { id: string });
