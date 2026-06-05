export interface CreditPack {
  id: "single" | "trio" | "deca";
  name: string;
  credits: number;
  pricePaise: number; // INR paise
  badge?: string;
  description: string;
  perRunPaise: number;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "single",
    name: "Solo Run",
    credits: 1,
    pricePaise: 49_900, // ₹499
    perRunPaise: 49_900,
    description: "One full architecture. Perfect to validate a single idea.",
  },
  {
    id: "trio",
    name: "Trio",
    credits: 3,
    pricePaise: 1_29_900, // ₹1,299
    perRunPaise: 43_300,
    badge: "Most popular",
    description: "Three runs. Iterate on the brief or compare alternatives.",
  },
  {
    id: "deca",
    name: "Deca",
    credits: 10,
    pricePaise: 3_99_900, // ₹3,999
    perRunPaise: 39_990,
    badge: "Best value",
    description: "Ten runs. Built for serial founders and consulting shops.",
  },
];

export function getPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}
