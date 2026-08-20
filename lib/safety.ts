export type SafetyDecision = "allow" | "review" | "block";

export type SafetyCategory =
  | "adult-sexual"
  | "graphic-violence"
  | "self-harm-promotion"
  | "malware-phishing"
  | "illegal-marketplace"
  | "extremist-recruitment"
  | "exploitative-content"
  | "spam-deception";

export type SafetyAssessment = {
  decision: SafetyDecision;
  categories: SafetyCategory[];
  reason: string;
};

const blockedSchemes = ["file:", "ftp:", "gopher:", "data:", "javascript:"];

export function isPermittedCrawlUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (blockedSchemes.includes(url.protocol)) return false;
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;

    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "::1") return false;
    if (/^127\./.test(host)) return false;
    if (/^10\./.test(host)) return false;
    if (/^192\.168\./.test(host)) return false;
    if (/^169\.254\./.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;

    return true;
  } catch {
    return false;
  }
}

export const safetyPolicy = {
  universal: true,
  disableSwitch: false,
  block: [
    "Pornography and explicit sexual content",
    "Graphic gore whose primary purpose is shock or entertainment",
    "Content encouraging or instructing self-harm",
    "Malware, phishing and credential theft",
    "Illegal marketplaces and trafficking",
    "Extremist recruitment or operational propaganda",
    "Sexual exploitation and abusive material",
    "Deceptive spam and mass-generated manipulation",
  ],
  contextSensitive: [
    "Medical and health education",
    "News reporting",
    "History and war documentation",
    "Age-appropriate sex education",
    "Crime prevention and public-safety information",
  ],
} as const;
