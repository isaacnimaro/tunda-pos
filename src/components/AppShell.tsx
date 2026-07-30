import { NavLink, useLocation } from "react-router-dom";
import { Home, ShoppingCart, Package, Wallet, BarChart3, Settings as SettingsIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface Props { children: ReactNode; }

export default function AppShell({ children }: Props) {
  const { t } = useI18n();
  const loc = useLocation();
  const hideNav = 
    loc.pathname === "/lock" || 
    loc.pathname === "/setup" || 
    loc.pathname.startsWith("/sale/new") ||
    (loc.pathname.startsWith("/products/") && loc.pathname !== "/products");

  const items = [
    { to: "/", icon: Home, label: t.home },
    { to: "/sales", icon: ShoppingCart, label: t.sales },
    { to: "/products", icon: Package, label: t.stock },
    { to: "/settings", icon: SettingsIcon, label: t.settings },
  ];

  return (
    <div className="screen pb-[calc(5rem+env(safe-area-inset-bottom))] relative overflow-x-hidden">
      <div className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={loc.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
      {!hideNav && (
        <nav className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-md pb-safe">
          <div className="mx-4 mb-4 md:mb-6 rounded-[2rem] border border-border shadow-2xl bg-card/80 backdrop-blur-xl p-1">
            <ul className="grid grid-cols-4 px-1">
              {items.map(({ to, icon: Icon, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === "/"}
                    onClick={() => {
                        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                    }}
                    className={({ isActive }) =>
                      cn(
                        "flex flex-col items-center justify-center gap-1 py-3 text-[10px] sm:text-[11px] font-bold transition-all rounded-[1.5rem] mx-1 my-1",
                        isActive ? "text-primary bg-primary/10 shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )
                    }
                  >
                    <Icon className={cn("h-6 w-6 transition-transform hover:scale-110", "")} />
                    <span className="truncate max-w-[60px]">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
