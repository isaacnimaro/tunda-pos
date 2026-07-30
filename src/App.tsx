import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { setupAutoSync } from "./lib/sync";
import { I18nProvider } from "@/lib/i18n";
import AuthGate from "@/components/AuthGate";
import AppShell from "@/components/AppShell";
import Home from "./pages/Home";
import Setup from "./pages/Setup";
import Lock from "./pages/Lock";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import Sales from "./pages/Sales";
import NewSale from "./pages/NewSale";
import Expenses from "./pages/Expenses";
import Profit from "./pages/Profit";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const Shelled = ({ children }: { children: React.ReactNode }) => <AppShell>{children}</AppShell>;

const App = () => {
  useEffect(() => {
    setupAutoSync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              <Route element={<AuthGate />}>
                <Route path="/setup" element={<Setup />} />
                <Route path="/lock" element={<Lock />} />
                <Route path="/" element={<Shelled><Home /></Shelled>} />
                <Route path="/sales" element={<Shelled><Sales /></Shelled>} />
                <Route path="/sale/new" element={<Shelled><NewSale /></Shelled>} />
                <Route path="/products" element={<Shelled><Products /></Shelled>} />
                <Route path="/products/:id" element={<Shelled><ProductForm /></Shelled>} />
                <Route path="/expenses" element={<Shelled><Expenses /></Shelled>} />
                <Route path="/profit" element={<Shelled><Profit /></Shelled>} />
                <Route path="/settings" element={<Shelled><Settings /></Shelled>} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

export default App;
