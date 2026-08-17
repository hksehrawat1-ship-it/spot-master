/** STEP 8 — universal treatment stage and pathway browser (company-independent). */

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TREATMENT_STAGES, TREATMENT_PATHWAYS, STAGE_BY_NUMBER, STAGE_SYSTEM_VERSION,
} from "@/data/treatmentStages";
import type { TreatmentStage } from "@/data/treatmentStages";
import { ArrowLeft, ListOrdered, ShieldAlert, Route as RouteIcon } from "lucide-react";

const List = ({ title, items }: { title: string; items: string[] }) =>
  items.length ? (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-0.5">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  ) : null;

function StageDetail({ stage }: { stage: TreatmentStage }) {
  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Stage {stage.stageNumber}</Badge>
          <Badge variant="outline">{stage.stageId}</Badge>
          {stage.actionable && <Badge className="bg-amber-600 text-white">Actionable stage</Badge>}
        </div>
        <h2 className="text-lg font-bold">{stage.name}</h2>
        <p className="text-sm text-muted-foreground">{stage.plainName}</p>
        <p className="text-sm">{stage.technicalDescription}</p>
        <p className="text-sm text-muted-foreground">{stage.purpose}</p>
      </Card>

      <Card className="p-4 space-y-3">
        <List title="Required inputs" items={stage.requiredInputs} />
        <List title="Required preconditions" items={stage.requiredPreconditions} />
        <List title="Prohibited conditions" items={stage.prohibitedConditions} />
        <List title="Required equipment" items={stage.requiredEquipment} />
        <List title="Required PPE" items={stage.requiredPpe.map((p) => p.replace(/_/g, " "))} />
        <List title="Required training" items={stage.requiredTraining.map((t) => t.replace(/_/g, " "))} />
        <List title="Roles allowed" items={stage.requiredRoles.map((r) => r.replace(/_/g, " "))} />
      </Card>

      <Card className="p-4 space-y-3 border-destructive/40">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="h-4 w-4" />
          <p className="text-sm font-semibold">Stop conditions</p>
        </div>
        <ul className="list-disc pl-5 text-sm space-y-0.5">
          {stage.stopConditions.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <List title="Exit conditions" items={stage.exitConditions} />
        <p className="text-xs text-muted-foreground">
          Inspection {stage.requiredInspection ? "is mandatory" : "is not mandatory"} before moving on.
          Next allowed stages: {stage.nextAllowedStages.join(", ") || "—"}.
        </p>
      </Card>

      <p className="text-xs text-muted-foreground">
        Evidence requirement: {stage.evidenceRequirement.replace(/_/g, " ")} · Status {stage.status} · Version {stage.version}
      </p>
    </div>
  );
}

export default function TreatmentStages() {
  const { stageNumber } = useParams();
  const [tab, setTab] = useState<"stages" | "pathways">("stages");
  const selected = useMemo(
    () => (stageNumber !== undefined ? STAGE_BY_NUMBER[Number(stageNumber)] : undefined),
    [stageNumber],
  );

  if (selected) {
    return (
      <div className="pb-24 p-4 space-y-4">
        <Link to="/treatment-stages" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> All stages
        </Link>
        <StageDetail stage={selected} />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-primary/15 to-accent/10 p-4 space-y-2">
        <Link to="/stain-master" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Stain Master
        </Link>
        <div className="flex items-center gap-2">
          <ListOrdered className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Universal treatment stages</h1>
            <p className="text-xs text-muted-foreground">
              Products belong to verified treatment stages. They do not define the stain science or the workflow.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <Button size="sm" variant={tab === "stages" ? "default" : "outline"} onClick={() => setTab("stages")}>
            18 stages
          </Button>
          <Button size="sm" variant={tab === "pathways" ? "default" : "outline"} onClick={() => setTab("pathways")}>
            Pathways
          </Button>
        </div>

        {tab === "stages" ? (
          <div className="space-y-2">
            {TREATMENT_STAGES.map((s) => (
              <Link key={s.stageId} to={`/treatment-stages/${s.stageNumber}`}>
                <Card className="p-3 flex items-start gap-3 hover:border-primary/50 transition">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {s.stageNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.plainName}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.actionable && <Badge variant="outline" className="text-[10px]">Actionable</Badge>}
                      {s.requiredInspection && <Badge variant="outline" className="text-[10px]">Inspection gate</Badge>}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {TREATMENT_PATHWAYS.map((p) => (
              <Card key={p.pathwayId} className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <RouteIcon className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-sm">{p.name}</p>
                  {p.professionalOnly && <Badge variant="outline" className="text-[10px]">Professional</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                <div className="flex flex-wrap gap-1">
                  {p.stages.map((ps) => (
                    <Link key={`${p.pathwayId}-${ps.stageNumber}`} to={`/treatment-stages/${ps.stageNumber}`}>
                      <Badge variant={ps.optional ? "outline" : "secondary"} className="text-[10px]">
                        {ps.stageNumber}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">Stage system {STAGE_SYSTEM_VERSION}</p>
      </div>
    </div>
  );
}
