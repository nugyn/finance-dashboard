/**
 * Domain.com.au scrapers for clearance rate and suburb medians.
 * Note: These scrape public pages and may break if Domain changes their HTML.
 * Store rawText with every snapshot for debugging.
 */

interface ScraperResult {
  value: number;
  rawText: string;
}

export async function fetchMelbourneClearanceRate(): Promise<ScraperResult> {
  const url = "https://www.domain.com.au/auction-results/melbourne/";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PropertyDashboard/1.0)",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Domain clearance fetch error ${res.status}`);
  const html = await res.text();

  // Domain typically shows clearance rate as "XX%" in a prominent stat block
  const match = html.match(/clearance[^%]{0,100}?(\d{1,3})%/i) ||
                html.match(/(\d{1,3})%\s*(?:clearance|cleared)/i);
  if (!match) throw new Error("Could not parse Melbourne clearance rate from Domain HTML");

  const value = parseFloat(match[1]);
  return { value, rawText: `${match[1]}%` };
}

export async function fetchWerribeeMedianPrice(): Promise<ScraperResult> {
  const url = "https://www.domain.com.au/suburb-profile/werribee-vic-3030";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PropertyDashboard/1.0)",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Domain suburb fetch error ${res.status}`);
  const html = await res.text();

  // Domain suburb profile shows median house price like "$680,000"
  const match = html.match(/median[^$]{0,50}\$([\d,]+)/i) ||
                html.match(/\$([\d,]+)\s*(?:median|house)/i);
  if (!match) throw new Error("Could not parse Werribee median price from Domain HTML");

  const raw = match[1].replace(/,/g, "");
  const value = parseFloat(raw);
  return { value, rawText: `$${match[1]}` };
}
