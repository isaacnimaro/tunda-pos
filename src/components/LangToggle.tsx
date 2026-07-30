import { useI18n, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const Btn = ({ value, label }: { value: Lang; label: string }) => (
    <button
      onClick={() => setLang(value)}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
        lang === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </button>
  );
  return (
    <div className={cn("inline-flex gap-1 p-1 rounded-full bg-muted/60", className)}>
      <Btn value="en" label="EN" />
      <Btn value="lg" label="LG" />
    </div>
  );
}
