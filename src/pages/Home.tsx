import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, startOfDay, sumExpenses, sumSales, sumProfit } from "@/lib/db";
import { fmtUGX, useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/useSettings";
import LangToggle from "@/components/LangToggle";
import { Plus, ShoppingCart, Package, Wallet, BarChart3, AlertTriangle } from "lucide-react";

export default function Home() {
  const { t } = useI18n();
  const { settings } = useSettings();
  const nav = useNavigate();
  const startToday = startOfDay();

  const todaySales = useLiveQuery(async () => sumSales(startToday), [startToday], 0);
  const todayGrossProfit = useLiveQuery(async () => sumProfit(startToday), [startToday], 0);
  const todayExp = useLiveQuery(async () => sumExpenses(startToday), [startToday], 0);
  const lowStock = useLiveQuery(
    () => db.products.filter((p) => p.quantity_on_hand <= p.reorder_level).toArray(),
    [], []
  );

  const profit = (todayGrossProfit ?? 0) - (todayExp ?? 0);
  const profitPositive = profit >= 0;

  return (
    <div className="px-4 pt-5 pb-6 flex flex-col gap-5">
      <header className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{t.welcome}</p>
          <h1 className="text-xl leading-none font-bold tracking-tight mt-1">
            {settings?.business_name || t.appName}
          </h1>
        </div>
        <LangToggle />
      </header>

      {/* Profit hero card */}
      <section
        className="glass-panel text-white relative overflow-hidden bg-slate-900 dark:bg-slate-950 border border-slate-800"
        style={{
          boxShadow: "0 4px 20px -5px rgba(0,0,0,0.15)",
        }}
      >
        <div className="flex items-center justify-between opacity-80 uppercase tracking-widest text-[10px] font-semibold mb-2">
          <span>{t.todaysProfit}</span>
        </div>
        <p className="text-[2.5rem] font-bold tabular tracking-tight leading-none text-white">{fmtUGX(profit)}</p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-xl bg-slate-800/80 px-4 py-3">
            <p className="text-[10px] opacity-70 uppercase font-semibold text-slate-300">{t.todaysSales}</p>
            <p className="text-lg font-bold tabular mt-0.5 text-white">{fmtUGX(todaySales ?? 0)}</p>
          </div>
          <div className="rounded-xl bg-slate-800/80 px-4 py-3">
            <p className="text-[10px] opacity-70 uppercase font-semibold text-slate-300">{t.todaysExpenses}</p>
            <p className="text-lg font-bold tabular mt-0.5 text-white">{fmtUGX(todayExp ?? 0)}</p>
          </div>
        </div>
      </section>

      {/* Big primary action */}
      <button
        onClick={() => nav("/sale/new")}
        className="h-14 rounded-2xl text-[15px] font-semibold tracking-wide bg-primary text-primary-foreground shadow-[var(--shadow-tile)] flex items-center justify-center gap-2 active:scale-95 transition-all relative z-10"
      >
        <Plus className="h-5 w-5" /> {t.newSale}
      </button>

      {/* Tiles grid */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <Tile color="primary" icon={<ShoppingCart className="h-6 w-6 text-slate-700 dark:text-slate-300 mb-1" />} label={t.sales} onClick={() => nav("/sales")} />
        <Tile color="secondary" icon={<Package className="h-6 w-6 text-slate-700 dark:text-slate-300 mb-1" />} label={t.stock} onClick={() => nav("/products")} />
        <Tile color="accent" icon={<Wallet className="h-6 w-6 text-slate-700 dark:text-slate-300 mb-1" />} label={t.expenses} onClick={() => nav("/expenses")} />
        <Tile color="muted" icon={<BarChart3 className="h-6 w-6 text-slate-700 dark:text-slate-300 mb-1" />} label={t.profit} onClick={() => nav("/profit")} />
      </div>

      {/* Low stock warning */}
      {settings?.low_stock_alert && lowStock && lowStock.length > 0 && (
        <button
          onClick={() => nav("/products")}
          className="rounded-2xl bg-warning/15 border-2 border-warning/40 p-4 text-left flex gap-3 items-start active:scale-[.99]"
        >
          <AlertTriangle className="h-6 w-6 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-warning">{t.lowStock}</p>
            <p className="text-sm text-muted-foreground">
              {lowStock.slice(0, 3).map((p) => p.name).join(", ")}
              {lowStock.length > 3 ? "…" : ""}
            </p>
          </div>
        </button>
      )}
    </div>
  );
}

function Tile({ icon, label, onClick }: { color: "primary" | "secondary" | "accent" | "muted"; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="glass-tile flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl transition-colors">
      <div>{icon}</div>
      <p className="text-[13px] font-medium tracking-tight mt-1">{label}</p>
    </button>
  );
}
