/**
 * One full architecture run consumes a fixed number of credits.
 * Credits are the lowest-level accounting unit; the user always
 * thinks in "designs" (one design = RUN_COST_CREDITS credits).
 */
export const RUN_COST_CREDITS = 40;

export interface CreditPack {
  id: "single" | "trio" | "sprint" | "deca";
  name: string;
  credits: number; // raw credits granted (designs * RUN_COST_CREDITS)
  designs: number; // how many designs this pack buys
  pricePaise: number; // INR paise
  badge?: string;
  description: string;
  perDesignPaise: number; // displayed unit price
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "single",
    name: "Solo",
    designs: 1,
    credits: 1 * RUN_COST_CREDITS,
    pricePaise: 30_000, // ₹300
    perDesignPaise: 30_000,
    description: "One full architecture. Perfect to validate a single idea.",
  },
  {
    id: "trio",
    name: "Trio",
    designs: 3,
    credits: 3 * RUN_COST_CREDITS,
    pricePaise: 84_000, // ₹840
    perDesignPaise: 28_000, // ₹280
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
    description: "Ten designs. One product sprint’s worth of exploration.",
  },
  {
    id: "deca",
    name: "Studio",
    designs: 50,
    credits: 50 * RUN_COST_CREDITS,
    pricePaise: 10_00_000, // ₹10,000
    perDesignPaise: 20_000, // ₹200
    badge: "Best value",
    description: "Fifty designs at ₹200 each. For agencies, fractional CTOs, and engineers who design weekly.",
  },
];

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}
