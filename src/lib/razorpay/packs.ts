/**
 * One full architecture run consumes a fixed number of credits.
 * Credits are the lowest-level accounting unit; the user always
 * thinks in "designs" (one design = RUN_COST_CREDITS credits).
 */
export const RUN_COST_CREDITS = 40;

/**
 * Fixed INR-per-USD rate used to convert a pack's USD display price into
 * the INR amount actually charged to international customers. Razorpay
 * only settles in INR, so an international buyer sees a premium USD price
 * but is billed the equivalent INR (their card issuer does the forex).
 * Kept slightly conservative so the INR charge converts back to roughly
 * the displayed USD after the issuer's fee.
 */
export const USD_TO_INR_CHARGE = 84;

export interface CreditPack {
  id: "single" | "trio" | "sprint" | "deca";
  name: string;
  credits: number; // raw credits granted (designs * RUN_COST_CREDITS)
  designs: number; // how many designs this pack buys
  pricePaise: number; // INR paise (India price + actual charge for India)
  badge?: string;
  description: string;
  perDesignPaise: number; // displayed INR unit price
  priceUsdCents: number; // USD price shown to international customers
  perDesignUsdCents: number; // displayed USD unit price
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "single",
    name: "Solo",
    designs: 1,
    credits: 1 * RUN_COST_CREDITS,
    pricePaise: 30_000, // ₹300
    perDesignPaise: 30_000,
    priceUsdCents: 1_400, // $14
    perDesignUsdCents: 1_400,
    description: "One full architecture. Perfect to validate a single idea.",
  },
  {
    id: "trio",
    name: "Trio",
    designs: 3,
    credits: 3 * RUN_COST_CREDITS,
    pricePaise: 84_000, // ₹840
    perDesignPaise: 28_000, // ₹280
    priceUsdCents: 3_600, // $36
    perDesignUsdCents: 1_200, // $12
    badge: "Most popular",
    description: "Three designs. Iterate on the brief or compare alternatives.",
  },
  {
    id: "sprint",
    name: "Sprint",
    designs: 10,
    credits: 10 * RUN_COST_CREDITS,
    pricePaise: 2_50_000, // ₹2,500
    perDesignPaise: 25_000, // ₹250
    priceUsdCents: 9_900, // $99
    perDesignUsdCents: 990, // $9.90
    description: "Ten designs. One product sprint’s worth of exploration.",
  },
  {
    id: "deca",
    name: "Studio",
    designs: 50,
    credits: 50 * RUN_COST_CREDITS,
    pricePaise: 10_00_000, // ₹10,000
    perDesignPaise: 20_000, // ₹200
    priceUsdCents: 39_900, // $399
    perDesignUsdCents: 798, // $7.98
    badge: "Best value",
    description: "Fifty designs at $8 / ₹200 each. For agencies, fractional CTOs, and engineers who design weekly.",
  },
];

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

/**
 * The INR amount (in paise) to actually charge for a pack, given the
 * buyer's region. India pays the INR price directly; international
 * buyers are charged the INR equivalent of the USD price.
 */
export function chargePaiseForRegion(
  pack: CreditPack,
  region: "IN" | "INTL",
): number {
  return region === "INTL" ? pack.priceUsdCents * USD_TO_INR_CHARGE : pack.pricePaise;
}
