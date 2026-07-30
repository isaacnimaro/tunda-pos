import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Product, ProductCategory, adjustStock } from "@/lib/db";
import { useI18n, fmtUGX } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import { Plus, Minus, AlertTriangle, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Products() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const products = useLiveQuery(() => db.products.orderBy("name").toArray(), [], []);

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageHeader title={t.stock} right={
        <Button onClick={() => nav("/products/new")} className="rounded-full h-11 px-4">
          <Plus className="h-5 w-5 mr-1" /> {t.addProduct}
        </Button>
      } />
      <div className="px-4 pb-6 flex flex-col gap-3">
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..." 
            className="pl-10 h-12 rounded-xl bg-card border-border shadow-sm text-base"
          />
        </div>

        {filteredProducts && filteredProducts.length === 0 && (
          <p className="text-center text-muted-foreground py-12">{t.noProducts}</p>
        )}
        {filteredProducts?.map((p) => <ProductRow key={p.id} p={p} />)}
      </div>
    </>
  );
}

function ProductRow({ p }: { p: Product }) {
  const { t } = useI18n();
  const nav = useNavigate();
  const low = p.quantity_on_hand <= p.reorder_level;
  return (
    <div className="rounded-2xl bg-card border border-border p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base truncate">{p.name}</h3>
            {low && <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground capitalize">{t.productCategories[p.category]}</p>
          <p className="text-lg font-extrabold tabular text-primary mt-1">{fmtUGX(p.unit_price)}</p>
        </div>
        <button
          onClick={() => nav(`/products/${p.id}`)}
          className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
          aria-label={t.edit}
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className={`text-sm font-semibold ${low ? "text-warning" : "text-muted-foreground"}`}>
          <span className="tabular text-2xl font-extrabold text-foreground">{p.quantity_on_hand}</span> {t.inStock}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustStock(p.id!, -1)}
            className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center active:scale-95"
            aria-label="-1"
          >
            <Minus className="h-5 w-5" />
          </button>
          <button
            onClick={() => adjustStock(p.id!, 1)}
            className="h-10 w-10 rounded-full bg-secondary/15 text-secondary flex items-center justify-center active:scale-95"
            aria-label="+1"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function categoryOptions(): { value: ProductCategory }[] {
  return [{ value: "food" }, { value: "drinks" }, { value: "household" }, { value: "personal" }, { value: "airtime" }, { value: "other" }];
}
