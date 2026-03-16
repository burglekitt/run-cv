import type { HighlightedItem, Page } from "../types";
import { getMenuItemValue } from "./menu-actions";

export function computeNavigationHint(history: Page[]): string {
  // only show instructions on the very first, root page
  if (history.length <= 1) {
    return "Navigate with arrow keys ↑ ↓ ← →, Press 'q' to quit";
  }
  return "";
}

export function computeHighlightedItem(
  currentPage: Page | null,
  navigationMemory: Record<string, number>,
): HighlightedItem | null {
  if (!currentPage?.menu) return null;
  const idx = navigationMemory[currentPage.dir] ?? 0;
  const menuItem = currentPage.menu[idx];
  if (!menuItem) return null;

  const val = getMenuItemValue(menuItem);
  if (!val) {
    // there is nothing to drill into
    return null;
  }
  return { label: menuItem.label, value: val };
}

/**
 * Return whether a right-arrow drill-in action should be honored.
 * Top/middle levels must have a non-empty menu and a highlighted item.
 * Middle/bottom levels with no children are intentionally gated off.
 */
export function canDrillIn(
  currentPage: Page | null,
  highlightedItem: HighlightedItem | null,
): boolean {
  return !!(
    currentPage?.menu &&
    currentPage.menu.length > 0 &&
    highlightedItem
  );
}
