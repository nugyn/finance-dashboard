/**
 * ABS API fetcher for economic indicators.
 * API docs: https://api.data.abs.gov.au
 */

interface AbsResult {
  value: number;
  rawText: string;
}

async function fetchAbsLatest(dataflowId: string, key: string): Promise<AbsResult> {
  const url = `https://api.data.abs.gov.au/data/${dataflowId}/${key}?detail=dataonly&dimensionAtObservation=allDimensions&format=jsondata`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.sdmx.data+json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`ABS API error ${res.status} for ${dataflowId}/${key}`);
  const json = await res.json();
  // Navigate to observations — structure varies by dataset
  const observations = json?.data?.dataSets?.[0]?.observations;
  if (!observations) throw new Error(`No observations in ABS response for ${dataflowId}/${key}`);
  // Get the last value (most recent)
  const keys = Object.keys(observations);
  const lastKey = keys[keys.length - 1];
  const value = observations[lastKey][0];
  return { value: Number(value), rawText: String(value) };
}

export async function fetchRbaCashRate(): Promise<AbsResult> {
  // ABS doesn't publish RBA rate — use RBA HTML scraper instead
  // This falls back to the RBA scraper
  return fetchRbaHtml();
}

async function fetchRbaHtml(): Promise<AbsResult> {
  const res = await fetch("https://www.rba.gov.au/statistics/cash-rate/", {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`RBA fetch error ${res.status}`);
  const html = await res.text();
  // Find the first rate percentage in the table, e.g. "4.35%"
  const match = html.match(/(\d+\.\d+)%/);
  if (!match) throw new Error("Could not parse RBA cash rate from HTML");
  const value = parseFloat(match[1]);
  return { value, rawText: match[0] };
}

export async function fetchCpi(): Promise<AbsResult> {
  // CPI_9 is the headline CPI dataset
  return fetchAbsLatest("CPI", "1.10001.10.Q");
}

export async function fetchWpi(): Promise<AbsResult> {
  // Wage Price Index
  return fetchAbsLatest("WPI", "1.1.1.1.1.Q");
}

export async function fetchDwellingApprovals(): Promise<AbsResult> {
  // Building Approvals — total dwellings
  return fetchAbsLatest("BUILDING_APPROVALS", "1.1.AUS.1.M");
}
