import cron from "node-cron";
import { db } from "./db";
import { FETCHERS } from "./fetchers";
import { evaluateSignal } from "./signals";
import { checkAndAlert, sendWeeklyDigest } from "./alerts";

let initialized = false;

export function initScheduler() {
  if (initialized) return;
  initialized = true;

  // Run all indicators on their defined schedules
  // For simplicity in dev, also run a daily catch-all at 9am
  cron.schedule("0 9 * * *", async () => {
    console.log("[scheduler] Running daily indicator refresh");
    const indicators = await db.indicator.findMany();

    for (const ind of indicators) {
      const fetcher = FETCHERS[ind.key];
      if (!fetcher) continue;

      try {
        const { value, rawText } = await fetcher();
        const signal = evaluateSignal(value, ind);
        await db.snapshot.create({
          data: { indicatorId: ind.id, value, rawText, signal },
        });
        console.log(`[scheduler] ${ind.key}: ${value} (${signal})`);

        await checkAndAlert(ind, value, signal);
      } catch (err) {
        console.error(`[scheduler] Failed to fetch ${ind.key}:`, err);
      }
    }
  });

  // Clearance rate — Sunday evening
  cron.schedule("0 18 * * SUN", async () => {
    const key = "melbourne_clearance_rate";
    const fetcher = FETCHERS[key];
    if (!fetcher) return;
    try {
      const ind = await db.indicator.findUnique({ where: { key } });
      if (!ind) return;
      const { value, rawText } = await fetcher();
      const signal = evaluateSignal(value, ind);
      await db.snapshot.create({ data: { indicatorId: ind.id, value, rawText, signal } });
      console.log(`[scheduler] ${key}: ${value} (${signal})`);

      await checkAndAlert(ind, value, signal);
    } catch (err) {
      console.error(`[scheduler] Failed to fetch ${key}:`, err);
    }
  });

  // Weekly digest — Sunday 8am
  cron.schedule("0 8 * * SUN", async () => {
    console.log("[scheduler] Sending weekly digest");
    await sendWeeklyDigest();
  });

  console.log("[scheduler] Initialized");
}
