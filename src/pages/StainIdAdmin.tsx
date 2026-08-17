/**
 * Step 3 — Administrator and reviewer console for stain identification.
 * Corrections are versioned; historical cases are never rewritten.
 */
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStainId } from "@/store/useStainId";
import { runIdScenarios } from "@/lib/stainIdScenarios";
import { STAIN_BY_ID } from "@/data/stainKnowledge";

export default function StainIdAdmin() {
  const { cases, events, searchLog, review, remove } = useStainId();
  const runs = useMemo(() => runIdScenarios(), []);
  const passed = runs.filter((r) => r.pass).length;
  const [reviewer, setReviewer] = useState("reviewer@stainmaster");
  const [reason, setReason] = useState("");
  const [correct, setCorrect] = useState("");

  const noResult = searchLog.filter((s) => s.results === 0);
  const outcomes = cases.reduce<Record<string, number>>((acc, c) => {
    const k = c.result?.outcome ?? "in_progress";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const confirmed = cases.filter((c) => c.confirmedStainId).length;
  const rejectedAll = cases.filter((c) => !c.confirmedStainId && c.rejectedStainIds.length > 0).length;

  return (
    <div className="space-y-5 px-4 pb-28 pt-4">
      <div>
        <h1 className="text-2xl font-bold">Stain identification review</h1>
        <p className="text-sm text-muted-foreground">Step 3 reviewer console — identification only, no treatment data.</p>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Test scenarios</p>
          <Badge variant={passed === runs.length ? "default" : "destructive"}>{passed}/{runs.length} passing</Badge>
        </div>
        <ul className="mt-2 space-y-1 text-xs">
          {runs.map((r) => (
            <li key={r.name} className="flex justify-between gap-3">
              <span className={r.pass ? "text-muted-foreground" : "font-semibold text-destructive"}>{r.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {r.actual.outcome} · {r.actual.confidence}/10 · {r.actual.candidates} cand · {r.actual.riskAfter}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold">Analytics (privacy-conscious counters)</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>Cases: {cases.length} · confirmed candidate: {confirmed} · all rejected: {rejectedAll}</li>
          <li>Outcomes: {Object.entries(outcomes).map(([k, v]) => `${k} ${v}`).join(" · ") || "none yet"}</li>
          <li>Searches: {searchLog.length} · with no result: {noResult.length}</li>
          <li>Entry-route events: {events.filter((e) => e.name === "step3_entry_route").length}</li>
          <li>Hazard stops: {cases.filter((c) => c.result?.hazardStop).length} · damage route: {cases.filter((c) => c.result?.damageRoute).length}</li>
        </ul>
        {noResult.length > 0 && (
          <p className="mt-2 text-xs">Misleading or missing search terms: {Array.from(new Set(noResult.map((n) => n.term))).join(", ")}</p>
        )}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Reviewer identity</p>
        <Input value={reviewer} onChange={(e) => setReviewer(e.target.value)} aria-label="Reviewer" />
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for correction" aria-label="Reason for correction" />
        <Input value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder="Corrected stain id (e.g. curry)" aria-label="Corrected stain id" />
        <p className="text-xs text-muted-foreground">A correction creates a new case version and an audit entry. Earlier versions stay intact.</p>
      </Card>

      <div className="space-y-3">
        {cases.length === 0 && <Card className="p-4 text-sm text-muted-foreground">No identification cases recorded yet.</Card>}
        {cases.map((c) => (
          <Card key={c.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold">{c.result?.headline ?? "In progress"}</p>
                <p className="text-xs text-muted-foreground">{c.id} · v{c.version} · {new Date(c.updatedAt).toLocaleString()}</p>
              </div>
              <Badge variant="secondary">{c.result?.confidence ?? "—"}/10</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Risk {c.result?.riskBefore ?? c.riskBefore} → {c.result?.riskAfter ?? c.riskBefore} · gate {c.result?.gateAfter ?? c.gateBefore}
            </p>
            {c.result && (
              <ul className="list-disc pl-4 text-xs">
                {c.result.candidates.map((cand) => (
                  <li key={cand.stainId}>
                    #{cand.rank} {cand.name} ({cand.score} pts) — {cand.why[0]}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              Confirmed: {c.confirmedStainId ? STAIN_BY_ID[c.confirmedStainId]?.name ?? c.confirmedStainId : "none"} ·
              Rejected: {c.rejectedStainIds.map((r) => STAIN_BY_ID[r]?.name ?? r).join(", ") || "none"}
            </p>
            {c.reviewer && (
              <p className="text-xs text-primary">Reviewed by {c.reviewer.by}: {c.reviewer.reason}</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!reason.trim()}
                onClick={() => review(c.id, { by: reviewer, reason, correctedStainId: correct.trim() || null })}
              >
                Record correction
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>Delete case and images</Button>
            </div>
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">Audit history ({c.audit.length})</summary>
              <ul className="mt-1 space-y-1 text-[11px] text-muted-foreground">
                {c.audit.map((e) => (
                  <li key={e.id}>{new Date(e.at).toLocaleString()} — {e.action} by {e.by} {e.detail ? `(${e.detail})` : ""}</li>
                ))}
              </ul>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
}
