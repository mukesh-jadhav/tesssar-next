/**
 * One full architecture run consumes a fixed number of credits.
 * Credits are the lowest-level accounting unit; the user always
 * thinks in "designs" (one design = RUN_COST_CREDITS credits).
 */
export const RUN_COST_CREDITS = 40;

export interface CreditPack {
  id: "single" | "trio" | "deca";
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
    pricePaise: 4_900, // ₹49
    perDesignPaise: 4_900,
    description: "One full architecture. Perfect to validate a single idea.",
  },
  {
    id: "trio",
    name: "Trio",
    designs: 3,
    credits: 3 * RUN_COST_CREDITS,
    pricePaise: 12_900, // ₹129
    perDesignPaise: 4_300,
    badge: "Most popular",
    description: "Three designs. Iterate on the brief or compare alternatives.",
  },
  {
    id: "deca",
    name: "Deca",
    designs: 10,
    credits: 10 * RUN_COST_CREDITS,
    pricePaise: 39_900, // ₹399
    perDesignPaise: 3_990,
    badge: "Best value",
    description: "Ten designs. Built for serial founders and consulting shops.",
  },
];

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}
