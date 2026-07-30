import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/useSettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LangToggle from "@/components/LangToggle";
import { updateSettings, hashPin } from "@/lib/db";
import { markUnlocked } from "@/components/AuthGate";

export default function Setup() {
  const { t } = useI18n();
  const { settings, update } = useSettings();
  const nav = useNavigate();
  const [biz, setBiz] = useState("");
  const [owner, setOwner] = useState("");
  const [pin, setPin] = useState("");

  if (!settings) return null;

  const finishBiz = async () => {
    if (!biz.trim()) return;
    let pin_hash = undefined;
    if (pin.trim().length > 0) {
       pin_hash = await hashPin(pin.trim());
       markUnlocked();
    }
    await update({ business_name: biz.trim(), owner_name: owner.trim(), pin_hash });
    await updateSettings({ setup_complete: true });
    nav("/", { replace: true });
  };

  return (
    <div className="screen px-5 pt-10 pb-8 overflow-y-auto">
      <div className="flex justify-end"><LangToggle /></div>

      <div className="flex-1 flex flex-col gap-5 mt-6 pb-10">
        <div>
          <h1 className="text-3xl font-extrabold">{t.setupTitle}</h1>
          <p className="text-muted-foreground mt-1">{t.tagline}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-muted-foreground">{t.businessName}</label>
          <Input value={biz} onChange={(e) => setBiz(e.target.value)} className="h-14 text-lg rounded-2xl bg-card" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-muted-foreground">{t.ownerName}</label>
          <Input value={owner} onChange={(e) => setOwner(e.target.value)} className="h-14 text-lg rounded-2xl bg-card" />
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-sm font-bold text-muted-foreground">App Lock PIN (Optional)</label>
          <Input 
            type="password" 
            inputMode="numeric" 
            pattern="[0-9]*" 
            value={pin} 
            onChange={(e) => setPin(e.target.value)} 
            placeholder="e.g. 1234" 
            className="h-14 text-lg tracking-widest rounded-2xl bg-card" 
          />
          <p className="text-xs text-muted-foreground">Set a PIN to keep your app private. You can also do this later.</p>
        </div>

        <Button onClick={finishBiz} disabled={!biz.trim()} className="big-btn mt-4 bg-primary">{t.save}</Button>
      </div>
    </div>
  );
}
