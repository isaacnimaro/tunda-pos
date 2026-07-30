import { useEffect, useState } from "react";
import { getSettings, updateSettings, Settings } from "./db";

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    let m = true;
    getSettings().then((s) => m && setSettings(s));
    return () => { m = false; };
  }, []);
  const update = async (patch: Partial<Settings>) => {
    await updateSettings(patch);
    setSettings((s) => (s ? { ...s, ...patch } : s));
  };
  return { settings, update };
}
