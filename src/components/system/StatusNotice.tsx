import { AlertTriangle, CheckCircle2, Info, OctagonX, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NoticeTone = "proceed" | "caution" | "stop" | "info";

const TONE: Record<NoticeTone, { icon: LucideIcon; surface: string; text: string; border: string }> = {
  proceed: { icon: CheckCircle2, surface: "bg-proceed-surface", text: "text-proceed", border: "border-proceed/30" },
  caution: { icon: AlertTriangle, surface: "bg-caution-surface", text: "text-caution", border: "border-caution/30" },
  stop: { icon: OctagonX, surface: "bg-stop-surface", text: "text-stop", border: "border-stop/30" },
  info: { icon: Info, surface: "bg-info-surface", text: "text-info", border: "border-info/30" },
};

/**
 * Status is never communicated by colour alone: every notice carries an icon,
 * a written title and explanatory text.
 */
export default function StatusNotice({
  tone,
  title,
  children,
  className,
}: {
  tone: NoticeTone;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const t = TONE[tone];
  const Icon = t.icon;
  return (
    <div
      role={tone === "stop" ? "alert" : "note"}
      className={cn("rounded-[var(--radius)] border p-4", t.surface, t.border, className)}
    >
      <div className="flex gap-3">
        <Icon aria-hidden className={cn("mt-0.5 h-5 w-5 flex-none", t.text)} />
        <div className="min-w-0">
          <p className={cn("text-sm font-semibold", t.text)}>{title}</p>
          {children ? <div className="mt-1 text-sm text-foreground/85">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function StatusPill({ tone, label }: { tone: NoticeTone; label: string }) {
  const t = TONE[tone];
  const Icon = t.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        t.surface,
        t.border,
        t.text,
      )}
    >
      <Icon aria-hidden className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
