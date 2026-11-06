export type ItemStatus = 'collection' | 'wishlist';

export const CATEGORIES = [
  'tops',
  'tees',
  'knitwear',
  'denim',
  'trousers',
  'skirts',
  'dresses',
  'outerwear',
  'shoes',
  'accessories',
] as const;

export type Category = (typeof CATEGORIES)[number];

/** A row in the `item` table. Prices are integer cents. */
export type ItemRow = {
  id: string;
  status: ItemStatus;
  title: string;
  category: Category;
  brand: string | null;
  era: string | null;
  colour: string | null;
  size: string | null;
  notes: string | null;
  price_paid: number | null;
  target_price: number | null;
  new_low: number | null;
  new_high: number | null;
  vintage_low: number | null;
  vintage_high: number | null;
  confidence: number | null;
  acquired_at: string | null;
  acquired_where: string | null;
  created_at: string;
};

export type NewItem = Omit<ItemRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
