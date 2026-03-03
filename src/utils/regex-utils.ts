export function grabEmailPattern(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  return matches ? matches : [];
}

export function grabLinkedInPattern(text: string): string[] {
  const linkedInRegex = /https?:\/\/(www\.)?linkedin\.com\/[^\s)]+/g;
  const matches = text.match(linkedInRegex);
  return matches ? matches : [];
}
