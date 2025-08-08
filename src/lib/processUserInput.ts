import { ProcessedInput } from "@/types";

export function processUserInput(raw: string): ProcessedInput {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^(hi|hello|dear)[^\n]*\n/i, "");
  cleaned = cleaned.replace(/(best regards|sincerely|cheers)[^\n]*$/i, "");
  cleaned = cleaned.replace(/\n{2,}/g, "\n");
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");
  const MAX_CHARS = 1000;
  if (cleaned.length > MAX_CHARS) {
    return {
      cleaned: cleaned.slice(0, MAX_CHARS) + "...",
      tooLong: true,
      originalLength: raw.length,
    };
  }
  return {
    cleaned,
    tooLong: false,
    originalLength: raw.length,
  };
}
