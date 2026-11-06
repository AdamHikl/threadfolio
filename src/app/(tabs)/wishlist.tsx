import { ItemList, SummaryBox } from '@/components/ItemList';
import { wishlistTotal } from '@/db/items';
import { formatRange } from '@/lib/money';

export default function WishlistScreen() {
  return (
    <ItemList
      status="wishlist"
      emptyTitle="Wishlist"
      emptySubtitle="Pieces you're hunting for will appear here."
      renderSummary={(items) => (
        <SummaryBox
          lines={[
            ['Pieces', String(items.length)],
            ['Estimated total', formatRange(wishlistTotal(items))],
          ]}
        />
      )}
    />
  );
}
