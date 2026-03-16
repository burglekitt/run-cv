import { useInput } from "ink";
import type { HighlightedItem } from "../types";

interface ContactInfo {
  email?: string;
  linkedin?: string;
}

interface UseAppKeyboardOptions {
  canGoBack: boolean;
  hasError: boolean;
  isContactPage: boolean;
  highlightedItem: HighlightedItem | null;
  canUsePrimaryAction: boolean;
  contactInfo: ContactInfo;
  onBack: () => void;
  onQuit: () => void;
  onPrimaryAction: (item: HighlightedItem) => void;
  onContactEmail: () => void;
  onContactLinkedIn: () => void;
}

export function useAppKeyboard({
  canGoBack,
  hasError,
  isContactPage,
  highlightedItem,
  canUsePrimaryAction,
  contactInfo,
  onBack,
  onQuit,
  onPrimaryAction,
  onContactEmail,
  onContactLinkedIn,
}: UseAppKeyboardOptions): void {
  useInput((input, key) => {
    if (key.escape || key.leftArrow || (input === "b" && canGoBack)) {
      if (canGoBack) {
        onBack();
      }
      return;
    }

    if (input === "q" && (!canGoBack || hasError)) {
      onQuit();
      return;
    }

    if (isContactPage) {
      if (input === "m" && contactInfo.email) {
        onContactEmail();
      }
      if (input === "p" && contactInfo.linkedin) {
        onContactLinkedIn();
      }
      return;
    }

    if (
      (key.rightArrow || input === " ") &&
      canUsePrimaryAction &&
      highlightedItem
    ) {
      onPrimaryAction(highlightedItem);
    }
  });
}
