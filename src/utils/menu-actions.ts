import type { MenuItem } from "../types";

export interface MenuSelectItem {
  label: string;
  value: string;
}

export type MenuAction =
  | { type: "download-pdf"; filename: string }
  | { type: "open-url"; url: string }
  | { type: "navigate"; file: string }
  | { type: "noop" };

export function getMenuItemValue(item: MenuItem): string | undefined {
  return item.file ?? item.theme ?? item.url ?? item.link;
}

export function getMenuSelectItems(menu: MenuItem[]): MenuSelectItem[] {
  return menu
    .map((item) => {
      const value = getMenuItemValue(item);
      if (!value) {
        return null;
      }

      return {
        label: item.label,
        value,
      };
    })
    .filter((item): item is MenuSelectItem => item !== null);
}

export function findMenuItemByValue(
  menu: MenuItem[] | undefined,
  value: string,
): MenuItem | undefined {
  if (!menu) {
    return undefined;
  }

  return menu.find((item) => getMenuItemValue(item) === value);
}

export function findMenuItemIndexByValue(
  menu: MenuItem[] | undefined,
  value: string,
): number {
  if (!menu) {
    return -1;
  }

  return menu.findIndex((item) => getMenuItemValue(item) === value);
}

export function resolveMenuAction(
  menuItem: MenuItem | undefined,
  humanName: string,
): MenuAction {
  if (!menuItem) {
    return { type: "noop" };
  }

  if (menuItem.theme) {
    return {
      type: "download-pdf",
      filename: `${humanName.toLowerCase()}-${menuItem.theme}-cv.pdf`,
    };
  }

  if (menuItem.file?.toLowerCase().endsWith(".pdf")) {
    return {
      type: "download-pdf",
      filename: menuItem.file,
    };
  }

  if (menuItem.file) {
    return {
      type: "navigate",
      file: menuItem.file,
    };
  }

  const externalUrl = menuItem.url ?? menuItem.link;
  if (externalUrl) {
    return {
      type: "open-url",
      url: externalUrl,
    };
  }

  return { type: "noop" };
}
