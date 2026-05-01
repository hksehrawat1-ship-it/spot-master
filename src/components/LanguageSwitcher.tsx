import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGS } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  variant?: "compact" | "full";
}

export default function LanguageSwitcher({ variant = "compact" }: Props) {
  const { i18n } = useTranslation();
  const current = SUPPORTED_LANGS.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGS[0];

  if (variant === "full") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {SUPPORTED_LANGS.map((l) => {
          const active = l.code === current.code;
          return (
            <button
              key={l.code}
              onClick={() => i18n.changeLanguage(l.code)}
              className={`flex flex-col items-start gap-0.5 rounded-xl border-2 p-3 text-left transition-all ${
                active
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <span className="font-serif text-base font-bold">{l.native}</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {l.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Select value={current.code} onValueChange={(v) => i18n.changeLanguage(v)}>
      <SelectTrigger className="h-8 w-auto gap-1 rounded-full border-border/60 bg-background/60 px-3 text-xs font-semibold">
        <Globe className="h-3.5 w-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SUPPORTED_LANGS.map((l) => (
          <SelectItem key={l.code} value={l.code} className="text-sm">
            {l.native}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
