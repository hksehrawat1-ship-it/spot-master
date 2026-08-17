import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { useFabricCheck } from "@/store/useFabricCheck";
import { GATE_LABEL, riskWord, runSeedScenarios, type GateStatus, type RiskLevel } from "@/lib/fabricSafety";

const RISKS: RiskLevel[] = ["green", "amber", "red", "black"];
const GATES: GateStatus[] = [
  "proceed", "proceed_with_testing", "professional_only",
  "blocked_pending_identification", "blocked_existing_damage", "specialist_material_route",
];

export default function FabricCheckAdmin() {
  const { assessments, applyOverride, remove } = useFabricCheck();
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [risk, setRisk] = useState<RiskLevel>("amber");
  const [gate, setGate] = useState<GateStatus>("proceed_with_testing");
  const scenarios = runSeedScenarios();


  return (
    <div className="space-y-5 px-4 pb-28 pt-4">
      <div>
        <h1 className="text-2xl font-bold">Fabric Check Review</h1>
        <p className="text-sm text-muted-foreground">Review assessments, override risk decisions with a reason, and monitor rule accuracy.</p>
      </div>

      <Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Rule accuracy (seed scenarios)</h2>
        <p className="text-lg font-bold">{scenarios.filter((s) => s.pass).length} / {scenarios.length} passing</p>
        <ul className="space-y-1 text-xs">
          {scenarios.map((s) => (
            <li key={s.name} className={s.pass ? "text-muted-foreground" : "text-destructive"}>
              {s.pass ? "PASS" : "FAIL"} — {s.name} ({s.actual.risk} / {s.actual.gate} / {s.actual.confidence})
            </li>
          ))}
        </ul>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Assessments ({assessments.length})</h2>
        {assessments.length === 0 && <Card className="p-4 text-sm text-muted-foreground">No assessments recorded yet.</Card>}
        {assessments.map((a) => {
          const effRisk = a.adminOverride?.riskLevel ?? a.result?.riskLevel;
          return (
            <Card key={a.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{a.answers.garmentType || "Untitled"} · {a.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.owner} · {a.answers.role.replace(/_/g, " ")} · v{a.version} · {new Date(a.updatedAt).toLocaleString()}
                  </p>
                </div>
                {effRisk && <Badge variant="secondary">{effRisk} — {riskWord(effRisk)}</Badge>}
              </div>
              {a.result && (
                <p className="text-xs text-muted-foreground">
                  Gate: {GATE_LABEL[a.adminOverride?.gate ?? a.result.gate]} · confidence {a.result.confidence} · score {a.result.score}
                </p>
              )}
              {a.adminOverride && (
                <p className="rounded-lg bg-muted/50 p-2 text-xs">
                  Override by {a.adminOverride.reviewer}: {a.adminOverride.reason}
                </p>
              )}

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setOpenId(openId === a.id ? null : a.id)} disabled={!a.result}>
                  {openId === a.id ? "Cancel" : "Override decision"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { remove(a.id); toast.success("Assessment deleted."); }}>Delete</Button>
              </div>

              {openId === a.id && (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {RISKS.map((r) => (
                      <Button key={r} size="sm" variant={risk === r ? "default" : "outline"} onClick={() => setRisk(r)}>{r}</Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {GATES.map((g) => (
                      <Button key={g} size="sm" variant={gate === g ? "default" : "outline"} onClick={() => setGate(g)}>{g.replace(/_/g, " ")}</Button>
                    ))}
                  </div>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for override (required)" aria-label="Reason for override" />
                  <Button
                    size="sm"
                    disabled={!reason.trim()}
                    onClick={() => {
                      applyOverride(a.id, { riskLevel: risk, gate, reason: reason.trim(), reviewer: user.email });
                      setReason("");
                      setOpenId(null);
                      toast.success("Override recorded in the audit trail.");
                    }}
                  >
                    Save override
                  </Button>
                </div>
              )}

              <details>
                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Audit trail ({a.audit.length})</summary>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {a.audit.map((e) => (
                    <li key={e.id}>{new Date(e.at).toLocaleString()} · {e.action} · {e.by}{e.detail ? ` · ${e.detail}` : ""}{e.reason ? ` · ${e.reason}` : ""}</li>
                  ))}
                </ul>
              </details>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
