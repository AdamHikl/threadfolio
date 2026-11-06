import { ItemList, SummaryBox } from '@/components/ItemList';
import { summarizeCollection } from '@/db/items';
import { formatCents, formatRange } from '@/lib/money';

export default function CollectionScreen() {
  return (
    <ItemList
      status="collection"
      emptyTitle="Your collection"
      emptySubtitle="Pieces you buy will appear here."
      renderSummary={(items) => {
        const s = summarizeCollection(items);
        return (
          <SummaryBox
            lines={[
              ['Pieces', String(s.count)],
              ['You paid', formatCents(s.paid)],
              ['Estimated value', formatRange(s.estimatedValue)],
            ]}
          />
        );
      }}
    />
  );
}
