import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "lg";

const dict = {
  en: {
    appName: "Tunda APP",
    tagline: "Your shop, in your pocket",
    home: "Home",
    sales: "Sales", stock: "Stock", expenses: "Expenses", profit: "Profit", settings: "Settings",
    todaysProfit: "Today's profit", todaysSales: "Today's sales", todaysExpenses: "Today's expenses",
    newSale: "New sale", addProduct: "Add product", addExpense: "Add expense",
    name: "Name", category: "Category", sellPrice: "Sell price", costPrice: "Cost price",
    quantity: "Quantity", reorderLevel: "Low-stock level", inStock: "in stock", lowStock: "Low stock!",
    save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", confirm: "Confirm", back: "Back", done: "Done",
    cart: "Cart", addToCart: "Add", total: "Total", checkout: "Complete sale",
    cash: "Cash", mobileMoney: "Mobile money", credit: "Credit", bank: "Bank",
    paymentMethod: "Payment method", customerName: "Customer (optional)",
    description: "Description", amount: "Amount", date: "Date",
    today: "Today", week: "This week", month: "This month", custom: "Custom",
    startDate: "Start Date", endDate: "End Date",
    welcome: "Welcome back", enterPin: "Enter your 4-digit PIN", setPin: "Create a 4-digit PIN", confirmPin: "Confirm PIN",
    logIn: "Log in", logOut: "Log out", signUp: "Sign up",
    email: "Email address", password: "Password",
    phoneNum: "Phone Number", sendCode: "Send Code", enterCode: "Enter 6-digit Code", verifyCode: "Verify Code",
    wrongPin: "Wrong PIN, try again", pinSet: "PIN saved",
    setupTitle: "Set up your shop", businessName: "Shop name", ownerName: "Your name", location: "Location",
    language: "Language", english: "English", luganda: "Luganda",
    lowStockAlerts: "Low-stock alerts", theme: "Theme", light: "Light", dark: "Dark",
    backup: "Backup data", restore: "Restore data", exportNote: "Save a copy of all your data",
    saleSaved: "Sale saved", productSaved: "Product saved", expenseSaved: "Expense saved",
    noProducts: "No products yet. Add one!", noSales: "No sales yet today", noExpenses: "No expenses yet",
    stockSold: "Sold", stockBought: "Restock", adjustStock: "Adjust stock",
    receipt: "Receipt", items: "items",
    exportPdf: "Export PDF Report", exportReport: "Export Report", exportDesc: "Select your timeline.", timeframe: "Timeframe",
    daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "This Year", allTime: "All Time",
    generatingPdf: "Generating PDF...", downloadPdf: "Download PDF", reportDownloaded: "Report Downloaded!", exportError: "Export Error",
    categories: { stock_purchase: "Stock", electricity: "Electricity", water: "Water", transport: "Transport", airtime: "Airtime", license: "License", other: "Other" },
    productCategories: { food: "Food", drinks: "Drinks", household: "Household", personal: "Personal care", airtime: "Airtime", other: "Other" },
  },
  lg: {
    appName: "Tunda APP",
    tagline: "Dduuka lyo, mu nsawo yo",
    home: "Awaka",
    sales: "Ebyatundiddwa", stock: "Ebintu", expenses: "Ensaasaanya", profit: "Amagoba", settings: "Entegeka",
    todaysProfit: "Amagoba ga leero", todaysSales: "Ebyatundiddwa leero", todaysExpenses: "Ensaasaanya ya leero",
    newSale: "Tunda", addProduct: "Yongerako ekintu", addExpense: "Yongerako ensaasaanya",
    name: "Erinnya", category: "Ekika", sellPrice: "Ebbeeyi y'okutunda", costPrice: "Ebbeeyi y'okugula",
    quantity: "Obungi", reorderLevel: "Lekera ku", inStock: "biriwo", lowStock: "Bisembedde!",
    save: "Kuuma", cancel: "Sazaamu", delete: "Sazaamu", edit: "Kyusa", confirm: "Kakasa", back: "Komawo", done: "Kimaze",
    cart: "Kibbo", addToCart: "Teekamu", total: "Awamu", checkout: "Maliriza okutunda",
    cash: "Sente", mobileMoney: "Mobile Money", credit: "Banja", bank: "Bbanka",
    paymentMethod: "Engeri y'okusasula", customerName: "Erinnya ly'omuguzi (si lwetaaga)",
    description: "Ennyonnyola", amount: "Sente meka", date: "Olunaku",
    today: "Leero", week: "Wiiki eno", month: "Mwezi guno", custom: "Okwelondera",
    startDate: "Nga", endDate: "Okutuuka",
    welcome: "Tukwaniriza", enterPin: "Yingiza PIN yo eya 4", setPin: "Kola PIN ey'ennamba 4", confirmPin: "Ddamu okuyingiza PIN",
    logIn: "Yingira", logOut: "Fulumayo", signUp: "Kola akaawunti",
    email: "Email", password: "Pasipoodi (Password)",
    phoneNum: "Nnamba y'essimu", sendCode: "Sindika Koodi", enterCode: "Yingiza Koodi eya 6", verifyCode: "Kakasa Koodi",
    wrongPin: "PIN si ntuufu, ddamu", pinSet: "PIN ekuumiddwa",
    setupTitle: "Tandika edduuka lyo", businessName: "Erinnya ly'edduuka", ownerName: "Erinnya lyo", location: "Ekifo",
    language: "Olulimi", english: "Olungereza", luganda: "Oluganda",
    lowStockAlerts: "Okulabula ku bisembedde", theme: "Endabika", light: "Eky'omusana", dark: "Eky'ekiro",
    backup: "Kuuma data", restore: "Komyawo data", exportNote: "Kuuma kkopi ya data yonna",
    saleSaved: "Okutunda kukuumiddwa", productSaved: "Ekintu kikuumiddwa", expenseSaved: "Ensaasaanya ekuumiddwa",
    noProducts: "Tewali bintu. Yongerako ekimu!", noSales: "Tewali kyatundiddwa leero", noExpenses: "Tewali nsaasaanya",
    stockSold: "Tunzeeko", stockBought: "Wongeddeko", adjustStock: "Kyusa obungi",
    receipt: "Risiiti", items: "ebintu",
    exportPdf: "Funa alipoota ya PDF", exportReport: "Funa alipoota", exportDesc: "Londa ekiseera.", timeframe: "Ekiseera",
    daily: "Buli lunaku", weekly: "Buli wiiki", monthly: "Buli mwezi", yearly: "Omwaka guno", allTime: "Ekiseera kyonna",
    generatingPdf: "Kikola PDF...", downloadPdf: "Funa PDF", reportDownloaded: "Alipoota ekuumiddwa!", exportError: "Wabaddewo kiremya",
    categories: { stock_purchase: "Ebintu", electricity: "Amasannyalaze", water: "Amazzi", transport: "Entambula", airtime: "Eyaaya", license: "Layisensi", other: "Ebirala" },
    productCategories: { food: "Emmere", drinks: "Ebyokunywa", household: "Eby'omu nnyumba", personal: "Eby'omubiri", airtime: "Eyaaya", other: "Ebirala" },
  },
} as const;

type Dict = typeof dict.en;

interface I18nCtx { lang: Lang; setLang: (l: Lang) => void; t: Dict; }
const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("ys.lang") as Lang) || "en");
  useEffect(() => { localStorage.setItem("ys.lang", lang); document.documentElement.lang = lang === "lg" ? "lg" : "en"; }, [lang]);
  const setLang = (l: Lang) => setLangState(l);
  return <Ctx.Provider value={{ lang, setLang, t: dict[lang] as Dict }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}

export function fmtUGX(n: number) {
  return "UGX " + Math.round(n).toLocaleString("en-UG");
}
