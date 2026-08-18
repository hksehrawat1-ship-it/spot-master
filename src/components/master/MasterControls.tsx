import type { ReactNode } from "react";

/** Small shared controls for the Master Spotter workspace. Presentation only. */

export function ChipGroup({
  label,
  options,
  value,
  onChange,
  multi,
  values,
  hint,
}: {
  label: string;
  options: readonly string[];
  value?: string;
  values?: string[];
  onChange: (v: string) => void;
  multi?: boolean;
  hint?: string;
}) {
  const selected = (o: string) => (multi ? (values ?? []).includes(o) : value === o);
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-foreground">{label}</legend>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={selected(o)}
            onClick={() => onChange(o)}
            className={`min-h-[36px] rounded-full border px-3 text-xs font-medium transition-colors ${
              selected(o)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function PanelSection({
  title,
  description,
  children,
  tone = "default",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-destructive/40 bg-destructive/5"
      : tone === "warning"
        ? "border-amber-500/40 bg-amber-500/5"
        : "border-border bg-card";
  return (
    <section className={`space-y-3 rounded-xl border p-4 ${toneClass}`}>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function FieldRow({ label, value, verified }: { label: string; value: string; verified?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-right text-xs font-semibold ${verified === false ? "text-muted-foreground" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
