import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, startOfDay, startOfMonth, startOfWeek } from "@/lib/db";
import { useI18n, fmtUGX } from "@/lib/i18n";
import { useSettings } from "@/lib/useSettings";
import { generateReportPDF } from "@/lib/pdfExport";
import PageHeader from "@/components/PageHeader";
import { format } from "date-fns";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

type Range = "today" | "week" | "month" | "custom";

export default function Sales() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { settings } = useSettings();
  const [range, setRange] = useState<Range>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const from = range === "today" ? startOfDay() : range === "week" ? startOfWeek() : startOfMonth();
  const exportStart = range === "custom" ? (customStart ? new Date(customStart).getTime() : 0) : from;
  const exportEnd = range === "custom" ? (customEnd ? new Date(customEnd).setHours(23, 59, 59, 999) : Date.now()) : Date.now();

  const sales = useLiveQuery(
    () => {
      const q = db.sales.where("sale_date");
      return q.between(exportStart, exportEnd, true, true).reverse().sortBy("sale_date");
    },
    [exportStart, exportEnd], []
  );

  const total = (sales ?? []).filter((s) => s.status === "completed").reduce((s, r) => s + r.total_amount, 0);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generateReportPDF(exportStart, exportEnd, "raw", settings?.business_name || t.appName);
      toast({ title: t.reportDownloaded });
    } catch (e: any) {
      toast({ title: t.exportError, description: e.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <PageHeader title={t.sales} right={
        <Button onClick={() => nav("/sale/new")} className="rounded-full h-11 w-11 p-0 bg-primary"><Plus className="h-5 w-5" /></Button>
      } />
      <div className="px-4 pb-6 flex flex-col gap-4">
        <RangeTabs value={range} onChange={setRange} />
        
        {range === "custom" && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground ml-1">{t.startDate}</label>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground ml-1">{t.endDate}</label>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>
        )}

        <div className="rounded-[2rem] p-6 bg-primary text-primary-foreground shadow-2xl shadow-primary/20 bg-gradient-to-br from-primary to-emerald-600 relative overflow-hidden flex flex-col justify-between">
          <div className="z-10 relative">
            <p className="text-sm font-bold uppercase tracking-wider opacity-90">{t[range]}</p>
            <p className="text-4xl font-extrabold tabular mt-1">{fmtUGX(total)}</p>
          </div>
          
          <Button 
            disabled={isExporting} 
            onClick={handleExport}
            size="sm"
            variant="secondary"
            className="absolute top-5 right-5 rounded-full font-bold shadow-md z-20 hover:scale-105 transition-transform"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "..." : "PDF"}
          </Button>
        </div>

        {sales && sales.length === 0 && (
          <p className="text-center text-muted-foreground py-12">{t.noSales}</p>
        )}

        {sales?.map((s) => (
          <div key={s.id} className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold tabular">{format(new Date(s.sale_date), "HH:mm · dd MMM")}</p>
              <p className="text-xs text-muted-foreground capitalize">{s.payment_method.replace("_", " ")}{s.customer_name ? ` · ${s.customer_name}` : ""}</p>
            </div>
            <p className="text-lg font-extrabold tabular text-primary">{fmtUGX(s.total_amount)}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export function RangeTabs({ value, onChange }: { value: Range; onChange: (v: Range) => void }) {
  const { t } = useI18n();
  const opts: { v: Range; l: string }[] = [
    { v: "today", l: t.today }, { v: "week", l: t.week }, { v: "month", l: t.month }, { v: "custom", l: t.custom }
  ];
  return (
    <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-muted">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`h-11 rounded-xl font-bold text-xs sm:text-sm transition-colors ${value === o.v ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
