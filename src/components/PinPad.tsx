import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}

export default function PinPad({ length = 4, value, onChange, autoFocus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  return (
    <div
      className="flex flex-col items-center gap-6"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex gap-3">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-16 w-12 rounded-2xl border-2 flex items-center justify-center text-3xl font-extrabold tabular",
              i < value.length ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
            )}
          >
            {i < value.length ? "•" : ""}
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        maxLength={length}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        className="sr-only"
        aria-label="PIN"
      />
    </div>
  );
}

export function NumPad({ value, onChange, length = 4 }: { value: string; onChange: (v: string) => void; length?: number; }) {
  const press = (k: string) => {
    if (k === "del") onChange(value.slice(0, -1));
    else if (value.length < length) onChange(value + k);
  };
  const keys = ["1","2","3","4","5","6","7","8","9","","0","del"];
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
      {keys.map((k, i) => (
        k === "" ? <div key={i} /> :
        <button
          key={i}
          type="button"
          onClick={() => press(k)}
          className="h-16 rounded-2xl bg-card border border-border text-2xl font-bold active:scale-95 active:bg-muted transition-transform"
        >
          {k === "del" ? "⌫" : k}
        </button>
      ))}
    </div>
  );
}
