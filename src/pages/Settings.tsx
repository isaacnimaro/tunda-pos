import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/useSettings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import LangToggle from "@/components/LangToggle";
import { db } from "@/lib/db";
import { toast } from "@/hooks/use-toast";
import { markLocked } from "@/components/AuthGate";
import { Lock, Upload, Download, LogOut, LayoutGrid } from "lucide-react";
import { format } from "date-fns";

export default function Settings() {
  const { t } = useI18n();
  const { settings, update } = useSettings();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    business_name: settings?.business_name || "",
    owner_name: settings?.owner_name || "",
    location: settings?.location || ""
  });

  useEffect(() => {
    if (settings) {
      setForm({
        business_name: settings.business_name,
        owner_name: settings.owner_name,
        location: settings.location
      });
    }
  }, [settings?.business_name, settings?.owner_name, settings?.location]);

  const hasChanges = settings && (
    form.business_name !== settings.business_name ||
    form.owner_name !== settings.owner_name ||
    form.location !== settings.location
  );

  const handleSave = async () => {
    await update({ 
      business_name: form.business_name, 
      owner_name: form.owner_name, 
      location: form.location 
    });
    toast({ title: t.done });
  };

  if (!settings) return null;

  const setTheme = async (theme: "light" | "dark") => {
    await update({ theme });
    document.documentElement.classList.toggle("dark", theme === "dark");
  };

  const exportData = async () => {
    try {
      const data = {
        products: await db.products.toArray(),
        sales: await db.sales.toArray(),
        sale_items: await db.sale_items.toArray(),
        expenses: await db.expenses.toArray(),
        settings: await db.settings.get(1)
      };
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${settings.business_name.replace(/\s+/g, "_") || "Tunda"}_Backup_${format(Date.now(), "yyyyMMdd")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t.done });
    } catch (e: any) {
      toast({ title: "Backup Error", description: e.message, variant: "destructive" });
    }
  };

  const importData = async (file: File) => {
    try {
      const txt = await file.text();
      const data = JSON.parse(txt);
      await db.transaction("rw", [db.products, db.sales, db.sale_items, db.expenses, db.settings], async () => {
        await Promise.all([db.products.clear(), db.sales.clear(), db.sale_items.clear(), db.expenses.clear()]);
        if (data.products) await db.products.bulkAdd(data.products);
        if (data.sales) await db.sales.bulkAdd(data.sales);
        if (data.sale_items) await db.sale_items.bulkAdd(data.sale_items);
        if (data.expenses) await db.expenses.bulkAdd(data.expenses);
      });
      toast({ title: t.done });
    } catch (e: any) {
      toast({ title: e.message ?? "Error", variant: "destructive" });
    }
  };

  return (
    <>
      <PageHeader title={t.settings} />
      <div className="px-4 pb-6 flex flex-col gap-5">
        <Group>
          <Label className="text-sm font-bold text-muted-foreground">{t.businessName}</Label>
          <Input value={form.business_name} onChange={(e) => setForm({...form, business_name: e.target.value})} className="h-12 rounded-2xl" />
          <Label className="text-sm font-bold text-muted-foreground">{t.ownerName}</Label>
          <Input value={form.owner_name} onChange={(e) => setForm({...form, owner_name: e.target.value})} className="h-12 rounded-2xl" />
          <Label className="text-sm font-bold text-muted-foreground">{t.location}</Label>
          <Input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className="h-12 rounded-2xl" />
          
          {hasChanges && (
            <Button onClick={handleSave} className="mt-2 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base">
              {t.save}
            </Button>
          )}
        </Group>

        <Group>
          <Row label={t.language}><LangToggle /></Row>
          <Row label={t.theme}>
            <div className="flex gap-2">
              <ThemeBtn active={settings.theme === "light"} onClick={() => setTheme("light")}>{t.light}</ThemeBtn>
              <ThemeBtn active={settings.theme === "dark"} onClick={() => setTheme("dark")}>{t.dark}</ThemeBtn>
            </div>
          </Row>
          <Row label={t.lowStockAlerts}>
            <Switch checked={settings.low_stock_alert} onCheckedChange={(v) => update({ low_stock_alert: v })} />
          </Row>
        </Group>

        <Group>


          <div className="mt-2 flex gap-3">
            <Button variant="outline" onClick={exportData} className="flex-1 justify-center gap-2 h-12 rounded-xl">
              <Download className="h-4 w-4" /> {t.backup}
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="flex-1 justify-center gap-2 h-12 rounded-xl">
              <Upload className="h-4 w-4" /> {t.restore}
            </Button>
          </div>
          <input ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ""; }} />
          <Button variant="outline" onClick={() => { markLocked(); nav("/lock", { replace: true }); }} className="big-btn justify-start gap-2 text-destructive">
            <LogOut className="h-5 w-5" /> {t.logOut}
          </Button>
        </Group>
      </div>
    </>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <section className="glass-panel flex flex-col gap-3">{children}</section>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="font-semibold">{label}</span>{children}</div>;
}
function ThemeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 h-9 rounded-full text-sm font-bold ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
      {children}
    </button>
  );
}
