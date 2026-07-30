import Dexie, { Table } from "dexie";

export type ProductCategory = "food" | "drinks" | "household" | "personal" | "airtime" | "other";
export type PaymentMethod = "cash" | "mobile_money" | "credit" | "bank";
export type SaleStatus = "completed" | "pending" | "refunded";
export type ExpenseCategory = "stock_purchase" | "electricity" | "water" | "transport" | "airtime" | "license" | "other";

export interface Product {
  id?: number;
  sync_id?: string;
  name: string;
  category: ProductCategory;
  unit_price: number;     // selling price UGX
  cost_price: number;     // cost UGX
  quantity_on_hand: number;
  reorder_level: number;
  created_at: number;
  updated_at: number;
  deleted?: boolean;
}

export interface Sale {
  id?: number;
  sync_id?: string;
  sale_date: number; // ms timestamp
  payment_method: PaymentMethod;
  customer_name?: string;
  total_amount: number;
  status: SaleStatus;
  deleted?: boolean;
}

export interface SaleItem {
  id?: number;
  sync_id?: string;
  sale_id: number;
  product_id: number;
  product_name: string; // snapshot
  unit_price_at_sale: number;
  cost_price_at_sale?: number;
  quantity: number;
  subtotal: number;
  deleted?: boolean;
}

export interface Expense {
  id?: number;
  sync_id?: string;
  expense_date: number;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  payment_method: PaymentMethod;
  product_id?: number;
  receipt_image?: string; // dataURL
  deleted?: boolean;
}

export interface Settings {
  id: 1;
  business_name: string;
  owner_name: string;
  location: string;
  language: "en" | "lg";
  currency: "UGX";
  date_format: string;
  pin_hash?: string;
  low_stock_alert: boolean;
  auto_backup: boolean;
  backup_frequency: "daily" | "weekly" | "monthly";
  theme: "light" | "dark";
  setup_complete: boolean;
}

class YSDatabase extends Dexie {
  products!: Table<Product, number>;
  sales!: Table<Sale, number>;
  sale_items!: Table<SaleItem, number>;
  expenses!: Table<Expense, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super("yobule_sente");
    this.version(2).stores({
      products: "++id, sync_id, name, category, quantity_on_hand, updated_at",
      sales: "++id, sync_id, sale_date, status, payment_method",
      sale_items: "++id, sync_id, sale_id, product_id",
      expenses: "++id, sync_id, expense_date, category",
      settings: "id",
    });
  }
}

export const db = new YSDatabase();

// ---------- helpers ----------

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get(1);
  if (s) return s;
  const def: Settings = {
    id: 1,
    business_name: "",
    owner_name: "",
    location: "Mutungo, Kampala",
    language: "en",
    currency: "UGX",
    date_format: "dd/MM/yyyy",
    low_stock_alert: true,
    auto_backup: false,
    backup_frequency: "weekly",
    theme: "light",
    setup_complete: false,
  };
  await db.settings.put(def);
  return def;
}

export async function updateSettings(patch: Partial<Settings>) {
  const cur = await getSettings();
  await db.settings.put({ ...cur, ...patch, id: 1 });
}

// Simple SHA-256 hash for PIN (offline, no extra deps)
export async function hashPin(pin: string) {
  const buf = new TextEncoder().encode("ys:" + pin);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Atomic checkout: writes Sale + SaleItems + decrements stock in one txn
export interface CartLine { product: Product; quantity: number; }

export async function checkoutSale(opts: {
  lines: CartLine[];
  payment_method: PaymentMethod;
  customer_name?: string;
}): Promise<number> {
  if (!opts.lines.length) throw new Error("Cart is empty");
  return db.transaction("rw", db.products, db.sales, db.sale_items, async () => {
    const total = opts.lines.reduce((s, l) => s + l.product.unit_price * l.quantity, 0);
    const sale_id = await db.sales.add({
      sale_date: Date.now(),
      payment_method: opts.payment_method,
      customer_name: opts.customer_name?.trim() || undefined,
      total_amount: total,
      status: "completed",
    });
    for (const line of opts.lines) {
      const fresh = await db.products.get(line.product.id!);
      if (!fresh) throw new Error("Product missing");
      if (fresh.quantity_on_hand < line.quantity) {
        throw new Error(`Not enough stock for ${fresh.name}`);
      }
      await db.products.update(fresh.id!, {
        quantity_on_hand: fresh.quantity_on_hand - line.quantity,
        updated_at: Date.now(),
      });
      await db.sale_items.add({
        sale_id,
        product_id: fresh.id!,
        product_name: fresh.name,
        unit_price_at_sale: line.product.unit_price,
        cost_price_at_sale: fresh.cost_price || 0,
        quantity: line.quantity,
        subtotal: line.product.unit_price * line.quantity,
      });
    }
    return sale_id;
  });
}

export async function adjustStock(productId: number, delta: number) {
  const p = await db.products.get(productId);
  if (!p) return;
  await db.products.update(productId, {
    quantity_on_hand: Math.max(0, p.quantity_on_hand + delta),
    updated_at: Date.now(),
  });
}

export function startOfDay(ts = Date.now()) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
export function startOfWeek(ts = Date.now()) {
  const d = new Date(ts); d.setHours(0, 0, 0, 0);
  const day = d.getDay(); const diff = (day + 6) % 7; // Mon start
  d.setDate(d.getDate() - diff); return d.getTime();
}
export function startOfMonth(ts = Date.now()) { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(1); return d.getTime(); }

export async function sumSales(fromTs: number, toTs = Date.now()) {
  const rows = await db.sales.where("sale_date").between(fromTs, toTs, true, true).and((s) => s.status === "completed").toArray();
  return rows.reduce((s, r) => s + r.total_amount, 0);
}

export async function sumProfit(fromTs: number, toTs = Date.now()) {
  const sales = await db.sales.where("sale_date").between(fromTs, toTs, true, true).and((s) => s.status === "completed").toArray();
  let grossProfit = 0;
  for (const sale of sales) {
    const items = await db.sale_items.where("sale_id").equals(sale.id!).toArray();
    for (const item of items) {
      let cost = (item.cost_price_at_sale ?? 0) * item.quantity;
      if (!item.cost_price_at_sale) {
        const p = await db.products.get(item.product_id);
        cost = (p?.cost_price || 0) * item.quantity;
      }
      grossProfit += (item.subtotal - cost);
    }
  }
  return grossProfit;
}

export async function sumExpenses(fromTs: number, toTs = Date.now()) {
  const rows = await db.expenses.where("expense_date").between(fromTs, toTs, true, true).toArray();
  return rows.reduce((s, r) => s + r.amount, 0);
}

export async function seedIfEmpty() {
  // Deliberately empty so new users start with a fresh shop
}

export async function exportDB() {
  return {
    products: await db.products.toArray(),
    sales: await db.sales.toArray(),
    sale_items: await db.sale_items.toArray(),
    expenses: await db.expenses.toArray(),
    settings: await db.settings.get(1)
  };
}
