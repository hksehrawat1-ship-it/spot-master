import { STATUS_PRESENTATION } from "@/data/adminWorkspace";
import type { GovStatus } from "@/data/governance";
import {
  Archive, AlertCircle, Calendar, Check, Clock, Eye, Globe, Languages, Layers, Map,
  Pause, Pencil, RotateCcw, Search, Shield, X,
} from "lucide-react";

const ICONS: Record<string, typeof Check> = {
  pencil: Pencil, "file-search": Search, eye: Eye, shield: Shield, map: Map,
  languages: Languages, "rotate-ccw": RotateCcw, check: Check, clock: Clock,
  globe: Globe, "alert-circle": AlertCircle, pause: Pause, x: X, layers: Layers,
  archive: Archive, "calendar-x": Calendar,
};

const TONES: Record<string, string> = {
  muted: "bg-secondary text-secondary-foreground border-border",
  amber: "bg-amber-50 text-amber-900 border-amber-300",
  blue: "bg-primary/10 text-primary border-primary/30",
  green: "bg-emerald-50 text-emerald-900 border-emerald-300",
  red: "bg-destructive/10 text-destructive border-destructive/30",
};

/** Status is always shown with text AND an icon — never colour alone. */
export default function StatusBadge({ status }: { status: GovStatus }) {
  const meta = STATUS_PRESENTATION[status];
  const Icon = ICONS[meta.icon] ?? AlertCircle;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONES[meta.tone]}`}
    >
      <Icon aria-hidden className="h-3 w-3" />
      {meta.label}
      {meta.blocksLive && <span className="sr-only"> — not live guidance</span>}
    </span>
  );
}
