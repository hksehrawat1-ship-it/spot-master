import { AlertTriangle, ShieldAlert } from "lucide-react";
import { FieldRow, PanelSection } from "@/components/master/MasterControls";
import {
  FAIL_CLOSED_MESSAGE,
  IMMEDIATE_STOP_CONDITIONS,
  OFFLINE_STALE_WARNING,
  UNKNOWN_CHEMISTRY_RESTRICTION,
  UNKNOWN_PRODUCT,
} from "@/data/masterSpotter";
import { emergencyGuidance, offlineSafetySummary, type MasterInstructionCard } from "@/lib/masterEngine";
import { useMaster } from "@/store/useMaster";

/** Right panel / "Safety" tab. Active warnings are never hidden in accordions. */
export default function MasterSafetyPanel({ card }: { card: MasterInstructionCard }) {
  const { current, offlineCache, patch } = useMaster();
  const offline = offlineSafetySummary(offlineCache);
  const unknownChemistry =
    current.previousChemical.product === UNKNOWN_PRODUCT ||
    current.previouslyTreated === "Yes — product unknown" ||
    current.ledger.some((e) => e.productName === UNKNOWN_PRODUCT);

  return (
    <div className="space-y-4">
      {!current.technicalDataAvailable && (
        <PanelSection title="Verified guidance unavailable" tone="danger">
          <p className="text-xs font-semibold text-destructive">{FAIL_CLOSED_MESSAGE}</p>
        </PanelSection>
      )}

      <PanelSection
        title="Current safety status"
        tone={card.status === "proceed" ? "default" : card.status === "test_required" ? "warning" : "danger"}
      >
        <p className="flex items-start gap-2 text-sm font-semibold">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {card.statusMessage}
        </p>
        <FieldRow label="Transition decision" value={card.transition.label} />
        <p className="text-xs text-muted-foreground">{card.transition.message}</p>
        {!card.transition.overridable && !card.transition.allowed && (
          <p className="text-xs font-bold text-destructive">This decision cannot be dismissed.</p>
        )}
      </PanelSection>

      <PanelSection title="Safety hierarchy" description="A lower-priority goal never overrides a higher-priority rule.">
        <ol className="space-y-1">
          {card.safety.map((s) => (
            <li
              key={s.key}
              className={`rounded-lg border p-2 text-xs ${
                s.triggered && !s.overridable ? "border-destructive/40 bg-destructive/5 font-semibold" : "border-border"
              }`}
            >
              {s.rank}. {s.label}
              {s.triggered && <span className="block text-muted-foreground">{s.message}</span>}
              {!s.overridable && <span className="ml-1 text-[11px] uppercase text-destructive">Non-overridable</span>}
            </li>
          ))}
        </ol>
      </PanelSection>

      {unknownChemistry && (
        <PanelSection title="Unknown previous chemistry" tone="danger">
          <p className="text-xs font-semibold">{UNKNOWN_CHEMISTRY_RESTRICTION}</p>
        </PanelSection>
      )}

      <PanelSection title="Immediate stop conditions" tone="warning">
        <div className="flex flex-wrap gap-1.5">
          {IMMEDIATE_STOP_CONDITIONS.map((s) => {
            const active = current.stopConditions.includes(s.key);
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  patch({
                    stopConditions: active
                      ? current.stopConditions.filter((x) => x !== s.key)
                      : [...current.stopConditions, s.key],
                  })
                }
                className={`min-h-[36px] rounded-full border px-3 text-xs font-medium ${
                  active ? "border-destructive bg-destructive text-destructive-foreground" : "border-border text-muted-foreground"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        {current.stopConditions.length > 0 && (
          <p className="flex items-start gap-2 text-xs font-bold text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Treatment is stopped. Document the garment and record the outcome.
          </p>
        )}
      </PanelSection>

      <PanelSection title="PPE and handling">
        <ul className="list-disc pl-4 text-xs">
          {card.ppe.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">{emergencyGuidance(null)}</p>
      </PanelSection>

      <PanelSection title="Offline safety summary" tone={offline.readable ? "warning" : "danger"}>
        <p className="text-xs">{offline.readable ? offline.warning : FAIL_CLOSED_MESSAGE}</p>
        {offline.readable && <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">{offline.content}</p>}
        {!offline.readable && <p className="mt-1 text-[11px] text-muted-foreground">{OFFLINE_STALE_WARNING}</p>}
      </PanelSection>
    </div>
  );
}
