import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const indicators = [
  // Economic
  {
    key: "rba_cash_rate",
    label: "RBA Cash Rate",
    category: "economic",
    unit: "%",
    sourceUrl: "https://www.rba.gov.au/statistics/cash-rate/",
    warnAbove: 4.5,
    badAbove: 5.0,
    warnBelow: null,
    badBelow: null,
    fetchCron: "0 9 * * MON",
  },
  {
    key: "cpi",
    label: "CPI (Inflation)",
    category: "economic",
    unit: "%",
    sourceUrl: "https://api.data.abs.gov.au",
    warnAbove: 3.5,
    badAbove: 5.0,
    warnBelow: null,
    badBelow: null,
    fetchCron: "0 9 1 * *",
  },
  {
    key: "wpi",
    label: "Wage Price Index",
    category: "economic",
    unit: "%",
    sourceUrl: "https://api.data.abs.gov.au",
    warnAbove: null,
    badAbove: null,
    warnBelow: 3.0,
    badBelow: 2.0,
    fetchCron: "0 9 1 * *",
  },
  {
    key: "dwelling_approvals",
    label: "Dwelling Approvals",
    category: "economic",
    unit: "count",
    sourceUrl: "https://api.data.abs.gov.au",
    warnAbove: null,
    badAbove: null,
    warnBelow: 10000,
    badBelow: 8000,
    fetchCron: "0 9 1 * *",
  },
  // Local market
  {
    key: "melbourne_clearance_rate",
    label: "Melbourne Clearance Rate",
    category: "local",
    unit: "%",
    sourceUrl: "https://www.domain.com.au/auction-results/melbourne/",
    warnAbove: null,
    badAbove: null,
    warnBelow: 60,
    badBelow: 50,
    fetchCron: "0 18 * * SUN",
  },
  {
    key: "werribee_median_price",
    label: "Werribee Median Price",
    category: "local",
    unit: "$",
    sourceUrl: "https://www.domain.com.au/suburb-profile/werribee-vic-3030",
    warnAbove: null,
    badAbove: null,
    warnBelow: 620000,
    badBelow: 580000,
    fetchCron: "0 9 1 * *",
  },
  {
    key: "rental_vacancy_rate",
    label: "Rental Vacancy Rate",
    category: "local",
    unit: "%",
    sourceUrl: "https://sqmresearch.com.au/graph_vacancy.php",
    warnAbove: 3.0,
    badAbove: 4.0,
    warnBelow: null,
    badBelow: null,
    fetchCron: "0 9 1 * *",
  },
  {
    key: "stock_on_market",
    label: "Stock on Market (3030)",
    category: "local",
    unit: "listings",
    sourceUrl: "https://sqmresearch.com.au/total-property-listings.php?postcode=3030",
    warnAbove: 150,
    badAbove: 200,
    warnBelow: null,
    badBelow: null,
    fetchCron: "0 9 1 * *",
  },
];

async function main() {
  for (const ind of indicators) {
    await prisma.indicator.upsert({
      where: { key: ind.key },
      update: ind,
      create: ind,
    });
  }
  console.log(`Seeded ${indicators.length} indicators`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
