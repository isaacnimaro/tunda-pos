import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getSettings, seedIfEmpty } from "@/lib/db";

export default function AuthGate() {
  const nav = useNavigate();
  const loc = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await seedIfEmpty();
      const s = await getSettings();
      if (!mounted) return;
      
      // apply theme
      document.documentElement.classList.toggle("dark", s.theme === "dark");
      
      const path = loc.pathname;
      const isUnlocked = sessionStorage.getItem("ys_unlocked") === "true";
      const needsLock = !!s.pin_hash;

      if (!s.setup_complete && path !== "/setup") {
        nav("/setup", { replace: true });
      } else if (s.setup_complete && needsLock && !isUnlocked && path !== "/lock") {
        nav("/lock", { replace: true });
      } else if (path === "/lock" && (!needsLock || isUnlocked)) {
        nav("/", { replace: true });
      }
      
      setReady(true);
    })();
    return () => { mounted = false; };
  }, [loc.pathname, nav]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        const s = await getSettings();
        if (s.pin_hash && sessionStorage.getItem("ys_unlocked") === "true") {
          sessionStorage.removeItem("ys_unlocked");
          window.location.href = "#/lock";
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  if (!ready) {
    return (
      <div className="screen items-center justify-center">
        <div className="flex-1 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }
  return <Outlet />;
}

export function markUnlocked() {
  sessionStorage.setItem("ys_unlocked", "true");
}

export async function markLocked() { 
  sessionStorage.removeItem("ys_unlocked");
  window.location.href = "#/lock";
}
