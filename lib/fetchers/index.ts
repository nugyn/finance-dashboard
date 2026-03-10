import { fetchRbaCashRate, fetchCpi, fetchWpi, fetchDwellingApprovals } from "./abs";
import { fetchMelbourneClearanceRate, fetchWerribeeMedianPrice } from "./domain";
import { fetchRentalVacancyRate, fetchStockOnMarket } from "./sqm";

export type FetcherFn = () => Promise<{ value: number; rawText: string }>;

export const FETCHERS: Record<string, FetcherFn> = {
  rba_cash_rate: fetchRbaCashRate,
  cpi: fetchCpi,
  wpi: fetchWpi,
  dwelling_approvals: fetchDwellingApprovals,
  melbourne_clearance_rate: fetchMelbourneClearanceRate,
  werribee_median_price: fetchWerribeeMedianPrice,
  rental_vacancy_rate: fetchRentalVacancyRate,
  stock_on_market: fetchStockOnMarket,
};
