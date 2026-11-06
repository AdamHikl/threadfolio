import type { Category } from '@/db/types';

/**
 * Curated "before you buy" checks. These are reviewed by hand and shown
 * alongside the AI's notes for the specific piece.
 */
const GENERAL: string[] = [
  'Check armpits, collar and cuffs for stains or yellowing.',
  'Smell it: mildew and smoke are hard to remove.',
  'Hold it up to the light to spot holes and thin areas.',
  'Measure it or try it on. Vintage sizes often run smaller than modern ones.',
];

const BY_CATEGORY: Partial<Record<Category, string[]>> = {
  tees: [
    'Look at the hems: single-stitch sleeves and hem usually mean pre-late-1990s.',
    'Check the tag for a modern care label or a reprint brand.',
    'Check the print for cracking and whether it sits in the fabric or on top.',
  ],
  denim: [
    'Check the crotch and inner thighs for thinning or blowouts.',
    'Look at the back of the top button and rivets for maker stamps.',
    'Read the care tag and fabric content; stretch blends are usually newer.',
  ],
  knitwear: [
    'Look for moth holes, especially at the elbows and under the arms.',
    'Check the fibre content tag (wool, cashmere, acrylic).',
    'Check for felting or bobbling where it rubs.',
  ],
  outerwear: [
    'Test every zip, snap and button.',
    'Check the lining for tears and the pocket bags for holes.',
    'For leather or suede, check for cracking, dryness and stiff patches.',
  ],
  dresses: [
    'Check the zip: metal zips at the back or side often mean older pieces.',
    'Look at the seams for room to alter and for stress tears.',
  ],
  shoes: [
    'Check the soles and heels for wear and crumbling rubber.',
    'Look inside for cracking insoles and smell for damp.',
  ],
  accessories: [
    'Check hardware, clasps and stitching.',
    'Look for maker marks or stamps that match the claimed brand.',
  ],
};

/** Curated checks for a category, then the AI's piece-specific checks, without duplicates. */
export function buildChecklist(category: Category, aiChecks: string[] = []): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const check of [...aiChecks, ...(BY_CATEGORY[category] ?? []), ...GENERAL]) {
    const key = check.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(check.trim());
    }
  }
  return out;
}
