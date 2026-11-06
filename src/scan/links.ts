export type PriceLink = { label: string; url: string };

/**
 * Links that open marketplace searches in the browser so the buyer can check
 * real prices themselves. We only build search URLs; we never scrape.
 */
export function priceCheckLinks(query: string): PriceLink[] {
  const q = encodeURIComponent(query.trim());
  if (!q) return [];
  return [
    {
      label: 'eBay sold listings',
      url: `https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1`,
    },
    { label: 'Etsy', url: `https://www.etsy.com/search?q=${q}` },
    { label: 'Depop', url: `https://www.depop.com/search/?q=${q}` },
  ];
}
