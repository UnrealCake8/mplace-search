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

const categoryPatterns: Array<{ category: SafetyCategory; patterns: RegExp[]; hardBlock?: boolean }> = [
  {
    category: "adult-sexual",
    hardBlock: true,
    patterns: [
      /\bporn(?:ography|ographic)?\b/i,
      /\bxxx\b/i,
      /\bexplicit sexual (?:video|videos|image|images|content)\b/i,
      /\badult sex (?:video|videos|site|sites|content)\b/i,
    ],
  },
  {
    category: "exploitative-content",
    hardBlock: true,
    patterns: [
      /\bchild sexual abuse material\b/i,
      /\bcsam\b/i,
      /\bsexual exploitation material\b/i,
    ],
  },
  {
    category: "malware-phishing",
    hardBlock: true,
    patterns: [
      /\bsteal (?:your )?(?:password|credentials|login)\b/i,
      /\bcredential phishing\b/i,
      /\bmalware download\b/i,
    ],
  },
  {
    category: "self-harm-promotion",
    patterns: [
      /\b(?:encourage|promote|instructions? for) self[- ]harm\b/i,
      /\bhow to (?:kill yourself|commit suicide)\b/i,
    ],
  },
  {
    category: "graphic-violence",
    patterns: [
      /\bgraphic gore\b/i,
      /\bgore videos?\b/i,
      /\breal death videos?\b/i,
    ],
  },
  {
    category: "illegal-marketplace",
    patterns: [
      /\bbuy stolen (?:cards|accounts|credentials)\b/i,
      /\billegal marketplace\b/i,
    ],
  },
  {
    category: "extremist-recruitment",
    patterns: [
      /\bjoin (?:our )?(?:terrorist|extremist) (?:group|movement)\b/i,
      /\bextremist recruitment\b/i,
    ],
  },
  {
    category: "spam-deception",
    patterns: [
      /\bguaranteed free money\b/i,
      /\bclick here to claim your prize\b/i,
    ],
  },
];

const legitimateContext = /\b(?:medical|medicine|health|education|educational|history|historical|news|reporting|research|prevention|safety|awareness|support|treatment|documentary)\b/i;

export function assessPageSafety(text: string): SafetyAssessment {
  const sample = text.slice(0, 120_000);
  const matches = categoryPatterns.filter((entry) => entry.patterns.some((pattern) => pattern.test(sample)));
  const categories = matches.map((entry) => entry.category);

  if (!categories.length) {
    return { decision: "allow", categories: [], reason: "No blocked-content signals detected." };
  }

  if (matches.some((entry) => entry.hardBlock)) {
    return { decision: "block", categories, reason: "Content matches a category MPlace does not index." };
  }

  if (legitimateContext.test(sample)) {
    return { decision: "review", categories, reason: "Sensitive content appears in a potentially legitimate context and requires review." };
  }

  return { decision: "block", categories, reason: "Sensitive content matched MPlace indexing restrictions." };
}

export const safetyPolicy = {
  universal: true,
  disableSwitch: true,
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
