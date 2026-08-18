import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChipGroup, PanelSection } from "@/components/master/MasterControls";
import { MASTER_OUTCOMES, NO_AUTO_GUIDANCE_NOTE, NO_STRONGER_CHEMISTRY_NOTE, type MasterOutcome } from "@/data/masterSpotter";
import { analyseFailure } from "@/lib/masterEngine";
import { useRecordCaseEvent, useSaveMasterCase } from "@/hooks/useMasterCase";
import { useMaster } from "@/store/useMaster";

/** "Outcome" tab — failure analysis, outcome, disposition and authoritative save. */
export default function MasterOutcomePanel() {
  const { current, patch, setSaveStatus } = useMaster();
  const { save } = useSaveMasterCase();
  const recordEvent = useRecordCaseEvent();
  const [busy, setBusy] = useState(false);

  const analysis = useMemo(() => analyseFailure(current, { stainRemains: true }), [current]);

  const persist = async () => {
    setBusy(true);
    setSaveStatus("saving");
    const { caseId, error } = await save(current);
    if (error) {
      setSaveStatus("error");
      toast.error(error);
    } else {
      patch({ caseId });
      setSaveStatus("saved");
      toast.success("Case record saved.");
      await recordEvent(caseId, "outcome", current.outcome ?? "Outcome not recorded", { status: current.outcome ?? "" });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <PanelSection title="Failure analysis" description={NO_STRONGER_CHEMISTRY_NOTE}>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold">Possible causes</p>
            {analysis.causes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No structural cause is indicated by the recorded case data.</p>
            ) : (
              <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                {analysis.causes.map((c) => (
                  <li key={c.key}>
                    <span className="font-semibold text-foreground">{c.label}</span> — {c.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold">Supported conclusions</p>
            <ul className="mt-1 list-disc pl-4 text-xs">
              {analysis.conclusions.map((c) => <li key={c.key}>{c.label}</li>)}
            </ul>
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Outcome" description={NO_AUTO_GUIDANCE_NOTE}>
        <ChipGroup
          label="Recorded outcome"
          options={MASTER_OUTCOMES}
          value={current.outcome ?? undefined}
          onChange={(v) => patch({ outcome: v as MasterOutcome })}
        />
      </PanelSection>

      <PanelSection title="Final disposition and customer communication">
        <div className="space-y-2">
          <Textarea
            rows={2}
            aria-label="Final disposition"
            placeholder="Final disposition"
            value={current.finalDisposition}
            onChange={(e) => patch({ finalDisposition: e.target.value })}
          />
          <Textarea
            rows={2}
            aria-label="Customer communication notes"
            placeholder="Customer communication notes"
            value={current.customerNotes}
            onChange={(e) => patch({ customerNotes: e.target.value })}
          />
        </div>
      </PanelSection>

      <PanelSection title="Authoritative case record">
        <p className="text-xs text-muted-foreground">
          The complete case, chemistry ledger and safety decisions are stored in the backend. Browser storage is never the
          authoritative record.
        </p>
        <Button className="mt-3 min-h-[44px] w-full" disabled={busy} onClick={persist}>
          {busy ? "Saving…" : current.caseId ? "Update case record" : "Save case record"}
        </Button>
      </PanelSection>
    </div>
  );
}
