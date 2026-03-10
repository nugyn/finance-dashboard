/**
 * SQM Research scrapers for vacancy rate and stock on market.
 * Free tier pages: sqmresearch.com.au
 */

interface ScraperResult {
  value: number;
  rawText: string;
}

export async function fetchRentalVacancyRate(): Promise<ScraperResult> {
  // SQM Research vacancy rate for Melbourne
  const url = "https://sqmresearch.com.au/graph_vacancy.php?region=vic%3A%3AMelbourne&type=c&t=1";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PropertyDashboard/1.0)",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`SQM vacancy fetch error ${res.status}`);
  const html = await res.text();

  // SQM shows vacancy as "X.X%" in their stat tables
  const match = html.match(/(\d+\.\d+)%/);
  if (!match) throw new Error("Could not parse vacancy rate from SQM HTML");

  const value = parseFloat(match[1]);
  return { value, rawText: `${match[1]}%` };
}

export async function fetchStockOnMarket(): Promise<ScraperResult> {
  // SQM stock on market for Werribee / 3030 postcode
  const url = "https://sqmresearch.com.au/total-property-listings.php?postcode=3030&t=1";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PropertyDashboard/1.0)",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`SQM stock fetch error ${res.status}`);
  const html = await res.text();

  // Look for the total listing count
  const match = html.match(/total[^0-9]{0,50}([\d,]+)/i) ||
                html.match(/([\d,]+)\s*(?:total|properties|listings)/i);
  if (!match) throw new Error("Could not parse stock on market from SQM HTML");

  const value = parseFloat(match[1].replace(/,/g, ""));
  return { value, rawText: match[1] };
}
