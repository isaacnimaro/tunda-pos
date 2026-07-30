import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hashPin } from "@/lib/db";
import { markUnlocked } from "@/components/AuthGate";
import { useSettings } from "@/lib/useSettings";
import { LockKeyhole } from "lucide-react";

export default function Lock() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { settings } = useSettings();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.getElementById("pin-input")?.focus();
  }, []);

  const handleUnlock = async () => {
    if (!pin || !settings) return;
    setLoading(true);

    if (!settings.pin_hash) {
      markUnlocked();
      nav("/", { replace: true });
      return;
    }

    const hashed = await hashPin(pin);
    setLoading(false);

    if (hashed === settings.pin_hash) {
      markUnlocked();
      nav("/", { replace: true });
    } else {
      toast({ title: t.wrongPin || "Incorrect PIN", variant: "destructive" });
      setPin("");
    }
  };

  if (!settings) return null;

  return (
    <div className="screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-5">
      <div className="w-full max-w-sm rounded-[2rem] bg-card border border-border shadow-2xl p-8 flex flex-col items-center gap-6 relative overflow-hidden">
        
        {/* Decorative background blurs */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />

        <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-primary to-emerald-400 p-[2px] shadow-lg shadow-primary/20 z-10">
          <div className="h-full w-full bg-card rounded-full flex items-center justify-center">
            <LockKeyhole className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="text-center z-10">
          <h1 className="text-2xl font-extrabold text-foreground">{settings.business_name || t.appName}</h1>
          <p className="text-muted-foreground text-sm font-semibold mt-1">
            {t.welcome || "Welcome back"}
          </p>
        </div>

        <div className="w-full space-y-4 z-10 mt-2">
          <div className="space-y-3">
            <Label className="text-center block text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t.enterPin || "Enter PIN"}
            </Label>
            <Input 
              id="pin-input"
              type="password" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin} 
              onChange={e => setPin(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && handleUnlock()}
              placeholder="••••" 
              maxLength={4}
              className="h-16 text-center text-3xl tracking-[1em] bg-background/50 border-2 border-primary/20 focus-visible:border-primary rounded-2xl shadow-inner font-bold transition-colors"
            />
          </div>
          
          <Button 
            onClick={handleUnlock} 
            disabled={loading || pin.length < 4} 
            className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white shadow-lg shadow-primary/25 mt-2 transition-all active:scale-[0.98]"
          >
            {loading ? "..." : (t.logIn || "Unlock")}
          </Button>
        </div>
      </div>
    </div>
  );
}
