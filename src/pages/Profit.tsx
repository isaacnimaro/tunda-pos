import { useEffect, useState } from "react";
import { startOfDay, startOfMonth, startOfWeek, sumExpenses, sumSales, sumProfit, db } from "@/lib/db";
import { useI18n, fmtUGX } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import { RangeTabs } from "./Sales";
import { TrendingUp, TrendingDown, Download, FileText } from "lucide-react";
import { generateReportPDF } from "@/lib/pdfExport";
import { useSettings } from "@/lib/useSettings";

type Range = "today" | "week" | "month";

export default function Profit() {
  const { t } = useI18n();
  const { settings } = useSettings();
  const [range, setRange] = useState<Range>("today");
  const [data, setData] = useState({ sales: 0, expenses: 0, grossProfit: 0 });
  const [bars, setBars] = useState<{ label: string; profit: number }[]>([]);

  useEffect(() => {
    (async () => {
      const from = range === "today" ? startOfDay() : range === "week" ? startOfWeek() : startOfMonth();
      const [s, e, p] = await Promise.all([sumSales(from), sumExpenses(from), sumProfit(from)]);
      setData({ sales: s, expenses: e, grossProfit: p });

      // 7-day bars regardless of range, for trend visualization
      const days: { label: string; profit: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
        const start = d.getTime();
        const end = start + 24 * 60 * 60 * 1000 - 1;
        const [pp, ee] = await Promise.all([sumProfit(start, end), sumExpenses(start, end)]);
        days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" })[0], profit: pp - ee });
      }
      setBars(days);
    })();
  }, [range]);

  const profit = data.grossProfit - data.expenses;
  const positive = profit >= 0;
  const max = Math.max(1, ...bars.map((b) => Math.abs(b.profit)));

  const exportData = async () => {
    const all = {
      products: await db.products.toArray(),
      sales: await db.sales.toArray(),
      sale_items: await db.sale_items.toArray(),
      expenses: await db.expenses.toArray(),
      settings: await db.settings.toArray(),
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `yobule-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const from = range === "today" ? startOfDay() : range === "week" ? startOfWeek() : startOfMonth();
    await generateReportPDF(from, Date.now(), settings?.business_name || t.appName);
  };

  return (
    <>
      <PageHeader title={t.profit} />
      <div className="px-4 pb-6 flex flex-col gap-4">
        <RangeTabs value={range} onChange={setRange} />

        <section className="glass-panel relative overflow-hidden bg-slate-900 dark:bg-slate-950 border border-slate-800 p-6 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.15)] mt-2">
          <div className="flex items-center justify-between opacity-80 uppercase tracking-widest text-[10px] font-semibold text-white">
            <span className="flex items-center gap-1.5">
              {positive ? <TrendingUp className="h-3.5 w-3.5 text-green-400" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
              {t.profit} · {t[range]}
            </span>
          </div>
          <p className="text-[2.5rem] font-bold tabular tracking-tight leading-none text-white mt-2">{fmtUGX(profit)}</p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-xl bg-slate-800/80 px-4 py-3">
              <p className="text-[10px] opacity-70 uppercase font-semibold text-slate-300">{t.sales}</p>
              <p className="text-base font-bold tabular text-white mt-0.5">{fmtUGX(data.sales)}</p>
            </div>
            <div className="rounded-xl bg-slate-800/80 px-4 py-3">
              <p className="text-[10px] opacity-70 uppercase font-semibold text-slate-300">{t.expenses}</p>
              <p className="text-base font-bold tabular text-white mt-0.5">{fmtUGX(data.expenses)}</p>
            </div>
          </div>
        </section>

        <section className="glass-panel">
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-4">7 days trend</p>
          <div className="flex items-end justify-between gap-2 h-32">
            {bars.map((b, i) => {
              const h = Math.round((Math.abs(b.profit) / max) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-lg ${b.profit >= 0 ? "bg-secondary" : "bg-destructive"}`}
                      style={{ height: `${Math.max(h, 4)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground">{b.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex gap-3">
          <button onClick={exportData} className="flex-1 h-12 glass border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all mb-0 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Download className="h-4 w-4" /> JSON
          </button>
          <button onClick={exportPDF} className="flex-[1.5] h-12 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-primary/90">
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
        <p className="text-xs text-center text-muted-foreground -mt-2">{t.exportNote}</p>
      </div>
    </>
  );
}
