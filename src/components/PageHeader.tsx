import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  title: string;
  back?: boolean;
  right?: ReactNode;
  subtitle?: string;
}

export default function PageHeader({ title, back, right, subtitle }: Props) {
  const nav = useNavigate();
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur px-4 pt-4 pb-3 flex items-center gap-3">
      {back && (
        <button
          onClick={() => nav(-1)}
          aria-label={t.back}
          className="h-10 w-10 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
