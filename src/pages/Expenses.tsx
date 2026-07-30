import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, ExpenseCategory, PaymentMethod } from "@/lib/db";
import { useI18n, fmtUGX } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const CATS: ExpenseCategory[] = ["stock_purchase", "electricity", "water", "transport", "airtime", "license", "other"];

export default function Expenses() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const expenses = useLiveQuery(() => db.expenses.orderBy("expense_date").reverse().toArray(), [], []);

  return (
    <>
      <PageHeader title={t.expenses} right={
        <Button onClick={() => setOpen(true)} className="rounded-full h-11 px-4">
          <Plus className="h-5 w-5 mr-1" /> {t.addExpense}
        </Button>
      } />
      <div className="px-4 pb-6 flex flex-col gap-3">
        {expenses && expenses.length === 0 && <p className="text-center text-muted-foreground py-12">{t.noExpenses}</p>}
        {expenses?.map((e) => (
          <div key={e.id} className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold">{t.categories[e.category]}</p>
              <p className="text-xs text-muted-foreground tabular">{format(new Date(e.expense_date), "dd MMM · HH:mm")}{e.description ? ` · ${e.description}` : ""}</p>
            </div>
            <p className="text-lg font-extrabold tabular text-destructive">−{fmtUGX(e.amount)}</p>
          </div>
        ))}
      </div>
      {open && <ExpenseSheet onClose={() => setOpen(false)} />}
    </>
  );
}

function ExpenseSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [cat, setCat] = useState<ExpenseCategory>("stock_purchase");
  const [amount, setAmount] = useState(0);
  const [desc, setDesc] = useState("");
  const [pay, setPay] = useState<PaymentMethod>("cash");

  const save = async () => {
    if (amount <= 0) return;
    await db.expenses.add({
      expense_date: Date.now(), category: cat, amount, description: desc.trim() || undefined, payment_method: pay,
    });
    toast({ title: t.expenseSaved });
    onClose();
  };

  const content = (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-md bg-background rounded-t-3xl p-5 pb-10 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto h-1.5 w-12 rounded-full bg-muted mb-4" />
        <h2 className="text-2xl font-extrabold mb-4">{t.addExpense}</h2>

        <p className="text-sm font-bold text-muted-foreground mb-2">{t.category}</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`h-12 rounded-2xl text-xs font-semibold border-2 px-1 ${cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
              {t.categories[c]}
            </button>
          ))}
        </div>

        <p className="text-sm font-bold text-muted-foreground mb-2">{t.amount}</p>
        <Input inputMode="numeric" value={amount === 0 ? "" : String(amount)}
          onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, "") || 0))}
          className="h-16 text-3xl rounded-2xl tabular font-extrabold mb-4" placeholder="0" />

        <p className="text-sm font-bold text-muted-foreground mb-2">{t.paymentMethod}</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(["cash", "mobile_money", "bank"] as PaymentMethod[]).map((m) => (
            <button key={m} onClick={() => setPay(m)}
              className={`h-12 rounded-2xl text-sm font-bold border-2 ${pay === m ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
              {m === "cash" ? t.cash : m === "mobile_money" ? t.mobileMoney : t.bank}
            </button>
          ))}
        </div>

        <p className="text-sm font-bold text-muted-foreground mb-2">{t.description}</p>
        <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="h-14 rounded-2xl mb-6" />

        <div className="flex gap-3 pb-safe">
          <Button variant="outline" onClick={onClose} className="flex-1 big-btn">{t.cancel}</Button>
          <Button onClick={save} className="flex-1 big-btn bg-primary text-primary-foreground">{t.save}</Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
