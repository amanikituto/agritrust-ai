import { createServerFn } from "@tanstack/react-start";

export type ClimateData = {
  location: { name: string; lat: number; lon: number };
  current: { temperatureC: number; rainfallMm: number; humidity: number; windKph: number };
  rainfall12mo: number[]; // monthly totals (mm)
  temperature12mo: number[]; // monthly avg (°C)
  ndvi12mo: number[]; // 0-1 derived proxy
  rainfall7d: number;
  droughtIndex: "Low" | "Med" | "High";
  alerts: { t: string; tone: "sky" | "gold" | "rose" | "emerald" }[];
  source: "open-meteo" | "fallback";
  error?: string;
};

const COUNTY_COORDS: Record<string, { lat: number; lon: number }> = {
  Kiambu: { lat: -1.171, lon: 36.83 },
  Nyeri: { lat: -0.42, lon: 36.95 },
  Kisumu: { lat: -0.0917, lon: 34.768 },
  Nakuru: { lat: -0.3031, lon: 36.08 },
  "Murang'a": { lat: -0.7833, lon: 37.04 },
  "Trans Nzoia": { lat: 1.0218, lon: 34.9789 },
  Machakos: { lat: -1.5177, lon: 37.2634 },
  Kakamega: { lat: 0.2827, lon: 34.7519 },
  Bungoma: { lat: 0.5635, lon: 34.5606 },
  Meru: { lat: 0.0463, lon: 37.6559 },
  Embu: { lat: -0.5316, lon: 37.4571 },
  Garissa: { lat: -0.4536, lon: 39.6401 },
  Turkana: { lat: 3.1167, lon: 35.6 },
  "Uasin Gishu": { lat: 0.5143, lon: 35.2698 },
};

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export const getClimate = createServerFn({ method: "GET" })
  .inputValidator((d: { county?: string } | undefined) => d ?? {})
  .handler(async ({ data }): Promise<ClimateData> => {
    const county = data.county && COUNTY_COORDS[data.county] ? data.county : "Kiambu";
    const { lat, lon } = COUNTY_COORDS[county];

    try {
      const end = new Date();
      const start = new Date();
      start.setFullYear(end.getFullYear() - 1);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);

      const [archiveRes, currentRes] = await Promise.all([
        fetch(
          `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
            `&start_date=${fmt(start)}&end_date=${fmt(end)}` +
            `&daily=precipitation_sum,temperature_2m_mean&timezone=Africa%2FNairobi`,
        ),
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m` +
            `&daily=precipitation_sum&past_days=7&forecast_days=1&timezone=Africa%2FNairobi`,
        ),
      ]);
      if (!archiveRes.ok || !currentRes.ok) throw new Error("Open-Meteo request failed");
      const archive = await archiveRes.json();
      const cur = await currentRes.json();

      const days: string[] = archive.daily?.time ?? [];
      const rains: number[] = archive.daily?.precipitation_sum ?? [];
      const temps: number[] = archive.daily?.temperature_2m_mean ?? [];

      // bucket into last 12 months
      const buckets: { rain: number[]; temp: number[] }[] = Array.from({ length: 12 }, () => ({ rain: [], temp: [] }));
      const labelStart = startOfMonth(new Date(end.getFullYear(), end.getMonth() - 11, 1));
      for (let i = 0; i < days.length; i++) {
        const d = new Date(days[i]);
        const diff = (d.getFullYear() - labelStart.getFullYear()) * 12 + (d.getMonth() - labelStart.getMonth());
        if (diff >= 0 && diff < 12) {
          if (typeof rains[i] === "number") buckets[diff].rain.push(rains[i]);
          if (typeof temps[i] === "number") buckets[diff].temp.push(temps[i]);
        }
      }
      const rainfall12mo = buckets.map((b) => Math.round(b.rain.reduce((a, c) => a + c, 0)));
      const temperature12mo = buckets.map((b) =>
        b.temp.length ? +(b.temp.reduce((a, c) => a + c, 0) / b.temp.length).toFixed(1) : 0,
      );
      // NDVI proxy from rainfall (smoothed, normalised to 0.3–0.85)
      const maxR = Math.max(...rainfall12mo, 1);
      const ndvi12mo = rainfall12mo.map((r, i, arr) => {
        const window = [arr[i - 1] ?? r, r, arr[i + 1] ?? r];
        const avg = window.reduce((a, c) => a + c, 0) / window.length;
        return +(0.3 + (avg / maxR) * 0.55).toFixed(2);
      });

      const recentRains: number[] = (cur.daily?.precipitation_sum ?? []).slice(-7);
      const rainfall7d = Math.round(recentRains.reduce((a, c) => a + c, 0));

      const lastQuarter = rainfall12mo.slice(-3).reduce((a, c) => a + c, 0);
      const avgQuarter = rainfall12mo.reduce((a, c) => a + c, 0) / 4;
      const droughtIndex: ClimateData["droughtIndex"] =
        lastQuarter < avgQuarter * 0.6 ? "High" : lastQuarter < avgQuarter * 0.9 ? "Med" : "Low";

      const alerts: ClimateData["alerts"] = [];
      if (rainfall7d > 40)
        alerts.push({ t: `Heavy rainfall (${rainfall7d}mm in 7d) — protect stored grain`, tone: "sky" });
      if (droughtIndex === "High")
        alerts.push({ t: `Drought intensifying in ${county} — consider drought-tolerant varieties`, tone: "rose" });
      if (droughtIndex === "Med")
        alerts.push({ t: `Rainfall below seasonal norms in ${county}`, tone: "gold" });
      if (!alerts.length)
        alerts.push({ t: `Conditions in ${county} are favourable for planting`, tone: "emerald" });

      return {
        location: { name: county, lat, lon },
        current: {
          temperatureC: cur.current?.temperature_2m ?? 0,
          rainfallMm: cur.current?.precipitation ?? 0,
          humidity: cur.current?.relative_humidity_2m ?? 0,
          windKph: cur.current?.wind_speed_10m ?? 0,
        },
        rainfall12mo,
        temperature12mo,
        ndvi12mo,
        rainfall7d,
        droughtIndex,
        alerts,
        source: "open-meteo",
      };
    } catch (err) {
      return {
        location: { name: county, lat, lon },
        current: { temperatureC: 22.4, rainfallMm: 0, humidity: 65, windKph: 9 },
        rainfall12mo: [40, 65, 80, 55, 38, 28, 22, 30, 48, 70, 88, 75],
        temperature12mo: [20, 21, 22, 22, 21, 20, 19, 19, 20, 21, 22, 22],
        ndvi12mo: [0.42, 0.48, 0.55, 0.6, 0.63, 0.65, 0.68, 0.7, 0.71, 0.7, 0.72, 0.71],
        rainfall7d: 48,
        droughtIndex: "Low",
        alerts: [{ t: "Live climate feed unavailable — showing cached estimates", tone: "gold" }],
        source: "fallback",
        error: err instanceof Error ? err.message : "Climate provider unavailable",
      };
    }
  });
