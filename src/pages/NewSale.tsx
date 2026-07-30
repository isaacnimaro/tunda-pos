import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, CartLine, checkoutSale, PaymentMethod } from "@/lib/db";
import { useI18n, fmtUGX } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Search, ShoppingBag } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function NewSale() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Map<number, CartLine>>(new Map());
  const [pay, setPay] = useState<PaymentMethod>("cash");
  const [customer, setCustomer] = useState("");
  const [step, setStep] = useState<"pick" | "review">("pick");

  const products = useLiveQuery(
    () => db.products.orderBy("name").toArray(),
    [], []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [products, query]);

  const total = Array.from(cart.values()).reduce((s, l) => s + l.product.unit_price * l.quantity, 0);
  const itemCount = Array.from(cart.values()).reduce((s, l) => s + l.quantity, 0);

  const setQty = (productId: number, qty: number) => {
    const next = new Map(cart);
    const line = next.get(productId);
    if (!line) return;
    if (qty <= 0) next.delete(productId);
    else next.set(productId, { ...line, quantity: Math.min(qty, line.product.quantity_on_hand) });
    setCart(next);
  };
  const add = (productId: number) => {
    const p = (products ?? []).find((x) => x.id === productId);
    if (!p || p.quantity_on_hand <= 0) return;
    const next = new Map(cart);
    const cur = next.get(productId);
    const newQty = (cur?.quantity ?? 0) + 1;
    if (newQty > p.quantity_on_hand) return;
    next.set(productId, { product: p, quantity: newQty });
    setCart(next);
  };

  const complete = async () => {
    try {
      const lines = Array.from(cart.values());
      await checkoutSale({ lines, payment_method: pay, customer_name: customer });
      toast({ title: t.saleSaved, description: fmtUGX(total) });
      nav("/sales");
    } catch (e: any) {
      toast({ title: e.message ?? "Error", variant: "destructive" });
    }
  };

  if (step === "review") {
    return (
      <>
        <PageHeader title={t.cart} back />
        <div className="px-4 pb-40 flex flex-col gap-3">
          {Array.from(cart.values()).map((l) => (
            <div key={l.product.id} className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{l.product.name}</p>
                <p className="text-sm text-muted-foreground tabular">{fmtUGX(l.product.unit_price)} × {l.quantity}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(l.product.id!, l.quantity - 1)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"><Minus className="h-4 w-4" /></button>
                <span className="w-6 text-center font-extrabold tabular">{l.quantity}</span>
                <button onClick={() => setQty(l.product.id!, l.quantity + 1)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"><Plus className="h-4 w-4" /></button>
              </div>
              <p className="font-extrabold tabular w-24 text-right">{fmtUGX(l.product.unit_price * l.quantity)}</p>
            </div>
          ))}

          <div className="mt-2">
            <p className="text-sm font-bold text-muted-foreground mb-2">{t.paymentMethod}</p>
            <div className="grid grid-cols-3 gap-2">
              {(["cash", "mobile_money", "credit"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setPay(m)}
                  className={`h-14 rounded-2xl font-bold text-sm border-2 ${pay === m ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}
                >
                  {m === "cash" ? t.cash : m === "mobile_money" ? t.mobileMoney : t.credit}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2">
            <p className="text-sm font-bold text-muted-foreground mb-1.5">{t.customerName}</p>
            <Input value={customer} onChange={(e) => setCustomer(e.target.value)} className="h-14 rounded-2xl text-lg" />
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-md p-4 bg-background/95 backdrop-blur border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-muted-foreground">{t.total}</span>
            <span className="text-3xl font-extrabold tabular text-primary">{fmtUGX(total)}</span>
          </div>
          <Button onClick={complete} className="w-full big-btn bg-secondary hover:bg-secondary/90 text-secondary-foreground">
            {t.checkout}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t.newSale} back />
      <div className="px-4 pb-40 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="h-14 pl-12 rounded-2xl text-lg" />
        </div>

        {filtered.map((p) => {
          const inCart = cart.get(p.id!)?.quantity ?? 0;
          const out = p.quantity_on_hand <= 0;
          return (
            <button
              key={p.id}
              disabled={out}
              onClick={() => add(p.id!)}
              className={`rounded-2xl p-4 flex items-center gap-3 text-left border-2 transition-colors ${
                inCart > 0 ? "border-primary bg-primary-soft" : "border-border bg-card"
              } ${out ? "opacity-40" : "active:scale-[.99]"}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{p.name}</p>
                <p className="text-sm text-muted-foreground tabular">{fmtUGX(p.unit_price)} · {p.quantity_on_hand} {t.inStock}</p>
              </div>
              {inCart > 0 ? (
                <span className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-extrabold tabular">{inCart}</span>
              ) : (
                <span className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center"><Plus className="h-5 w-5" /></span>
              )}
            </button>
          );
        })}
      </div>

      {itemCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-md p-4 bg-background/95 backdrop-blur border-t border-border">
          <Button onClick={() => setStep("review")} className="w-full big-btn bg-primary text-primary-foreground flex items-center justify-between px-5">
            <span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> {itemCount} {t.items}</span>
            <span className="tabular">{fmtUGX(total)}</span>
          </Button>
        </div>
      )}
    </>
  );
}
