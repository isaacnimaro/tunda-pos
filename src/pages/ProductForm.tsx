import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, Product, ProductCategory } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

const CATS: ProductCategory[] = ["food", "drinks", "household", "personal", "airtime", "other"];

export default function ProductForm() {
  const { id } = useParams();
  const editing = id && id !== "new";
  const nav = useNavigate();
  const { t } = useI18n();
  const [form, setForm] = useState<Omit<Product, "id" | "created_at" | "updated_at">>({
    name: "", category: "food", unit_price: 0, cost_price: 0, quantity_on_hand: 0, reorder_level: 5,
  });

  useEffect(() => {
    if (editing) {
      db.products.get(Number(id)).then((p) => {
        if (p) setForm({
          name: p.name, category: p.category, unit_price: p.unit_price,
          cost_price: p.cost_price, quantity_on_hand: p.quantity_on_hand, reorder_level: p.reorder_level,
        });
      });
    }
  }, [id, editing]);

  const save = async () => {
    if (!form.name.trim()) return;
    const now = Date.now();
    if (editing) {
      await db.products.update(Number(id), { ...form, updated_at: now });
    } else {
      await db.products.add({ ...form, created_at: now, updated_at: now });
    }
    toast({ title: t.productSaved });
    nav(-1);
  };

  const del = async () => {
    if (!editing) return;
    await db.products.delete(Number(id));
    nav(-1);
  };

  return (
    <>
      <PageHeader title={editing ? t.edit : t.addProduct} back right={editing ? (
        <button onClick={del} aria-label={t.delete} className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <Trash2 className="h-5 w-5" />
        </button>
      ) : undefined} />
      <div className="px-4 pb-32 flex flex-col gap-4">
        <Field label={t.name}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-14 text-lg rounded-2xl" />
        </Field>
        <Field label={t.category}>
          <div className="grid grid-cols-3 gap-2">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setForm({ ...form, category: c })}
                className={`h-12 rounded-2xl text-sm font-semibold border-2 transition-colors ${
                  form.category === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
                }`}
              >
                {t.productCategories[c]}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.sellPrice}><NumInput value={form.unit_price} onChange={(v) => setForm({ ...form, unit_price: v })} /></Field>
          <Field label={t.costPrice}><NumInput value={form.cost_price} onChange={(v) => setForm({ ...form, cost_price: v })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.quantity}><NumInput value={form.quantity_on_hand} onChange={(v) => setForm({ ...form, quantity_on_hand: v })} /></Field>
          <Field label={t.reorderLevel}><NumInput value={form.reorder_level} onChange={(v) => setForm({ ...form, reorder_level: v })} /></Field>
        </div>
      </div>
      <div className="fixed bottom-0 inset-x-0 mx-auto max-w-md p-4 pb-safe bg-background/95 backdrop-blur border-t border-border z-20">
        <Button onClick={save} className="w-full big-btn">{t.save}</Button>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-bold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <Input
      inputMode="numeric"
      pattern="[0-9]*"
      value={value === 0 ? "" : String(value)}
      onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "") || 0))}
      className="h-14 text-lg rounded-2xl tabular"
      placeholder="0"
    />
  );
}
