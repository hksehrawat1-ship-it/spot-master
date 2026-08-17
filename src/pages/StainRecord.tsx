/** STEP 6 — public stain page template (progressive disclosure, role-controlled). */

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useMasterStains } from "@/store/useMasterStains";
import { useApp } from "@/store/useApp";
import { publicView, professionalView } from "@/lib/masterStainEngine";
import { CATEGORY_LABEL } from "@/data/stainKnowledge";
import { FABRIC_LABEL, COLOUR_LABEL, PROHIBITION_LABEL, STAGE_LABEL, OUTCOME_LABEL } from "@/data/masterStains";
import type { AudienceRole, FabricKey } from "@/data/masterStains";
import { AlertTriangle, ArrowLeft, ShieldAlert } from "lucide-react";

export default function StainRecord() {
  const { stainKey } = useParams();
  const store = useMasterStains();
  const all = useMemo(() => store.all(), [store.overrides, store.custom]);
  const user = useApp((s) => s.user);
  const [showTechnical, setShowTechnical] = useState(false);

  const record = useMemo(() => all.find((s) => s.key === stainKey || s.stainId === stainKey), [all, stainKey]);
  const role: AudienceRole = user?.role === "admin" ? "technical_reviewer" : "domestic_user";

  if (!record) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">This stain record was not found.</p>
        <Link to="/stain-master" className="text-primary underline">Back to Stain Master</Link>
      </div>
    );
  }

  const isPublished = record.governance.status === "published";
  if (!isPublished && role !== "technical_reviewer") {
    return (
      <div className="p-4 space-y-3">
        <Badge variant="secondary">Not published</Badge>
        <p className="text-muted-foreground">
          This record is still being reviewed and is not published as public guidance yet.
        </p>
        <Link to="/stain-master" className="text-primary underline">Back to Stain Master</Link>
      </div>
    );
  }

  const view = publicView(record);
  const tech = professionalView(record, role);

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-primary/15 to-accent/10 p-4 space-y-2">
        <Link to="/stain-master" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Stain Master
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-3xl">{record.icon}</span>
          <div>
            <h1 className="text-xl font-bold leading-tight">{view.name}</h1>
            <p className="text-xs text-muted-foreground">{record.stainId} · {CATEGORY_LABEL[record.primaryCategory]}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={record.isDamageDiagnosis ? "destructive" : "secondary"}>{view.riskIndicator}</Badge>
          <Badge variant="outline">Confidence {record.classificationConfidence}/9</Badge>
          {record.canonicalOf && <Badge variant="outline">Variant of {record.canonicalOf}</Badge>}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {record.isDamageDiagnosis && (
          <Card className="p-4 border-destructive/40 bg-destructive/5">
            <div className="flex gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="font-semibold text-sm">Damage diagnosis, not a removable stain</p>
                <p className="text-sm text-muted-foreground">{record.damageInterpretation}</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 space-y-2">
          <h2 className="font-semibold">Short answer</h2>
          <p className="text-sm text-muted-foreground">{view.shortAnswer}</p>
        </Card>

        <Card className="p-4 border-amber-500/40 bg-amber-500/5">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Before you start</p>
              <p className="text-sm text-muted-foreground">{view.beforeYouStart}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <h2 className="font-semibold">Common sources</h2>
          <ul className="text-sm text-muted-foreground list-disc pl-5">
            {record.commonSources.map((c) => (
              <li key={c.name}>
                {c.name} — {c.context}
                {c.formulationVariable && <span className="text-amber-600"> (formulation varies — check the label)</span>}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 space-y-2">
          <h2 className="font-semibold">Likely stain type</h2>
          <p className="text-sm text-muted-foreground">{view.likelyStainType} — {view.whyDifficult}</p>
        </Card>

        <Card className="p-4 space-y-2">
          <h2 className="font-semibold">Fabric considerations</h2>
          <p className="text-sm"><span className="font-medium">Cautious assessment:</span> {view.materialsCautious.join(", ")}</p>
          <p className="text-sm"><span className="font-medium">Professional care:</span> {view.materialsProfessional.join(", ")}</p>
        </Card>

        <Card className="p-4 space-y-2">
          <h2 className="font-semibold">Safe first response</h2>
          {view.safeFirstResponse.map((f) => (
            <div key={f.id} className="space-y-1">
              <p className="text-sm text-muted-foreground">{f.action}</p>
              <p className="text-xs font-medium text-destructive">{f.heatWarning}</p>
              <ul className="text-xs text-muted-foreground list-disc pl-5">
                {f.prohibitedCircumstances.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          ))}
        </Card>

        <Card className="p-4 space-y-1">
          <h2 className="font-semibold">Domestic treatment</h2>
          <p className="text-sm font-semibold text-emerald-700">{view.domesticStatus}</p>
          <h2 className="font-semibold pt-2">Professional treatment</h2>
          <p className="text-sm text-muted-foreground">{view.professionalSummary}</p>
        </Card>

        <Card className="p-4 space-y-2">
          <h2 className="font-semibold">Actions to avoid</h2>
          <ul className="text-sm text-muted-foreground list-disc pl-5">
            {view.actionsToAvoid.map((p, i) => (
              <li key={i}><span className="font-medium">{PROHIBITION_LABEL[p.type]}</span> — {p.condition}. {p.reason}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 space-y-1">
          <h2 className="font-semibold">Expected result</h2>
          <p className="text-sm text-muted-foreground">{view.expectedResult}</p>
          <p className="text-xs text-muted-foreground">{record.expectedOutcomes[0]?.remainingPigment}</p>
        </Card>

        <Accordion type="single" collapsible className="rounded-lg border">
          <AccordionItem value="mistakes">
            <AccordionTrigger className="px-4 text-sm">Common mistakes</AccordionTrigger>
            <AccordionContent className="px-4">
              <ul className="text-sm text-muted-foreground list-disc pl-5">
                {view.commonMistakes.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="faq">
            <AccordionTrigger className="px-4 text-sm">FAQs</AccordionTrigger>
            <AccordionContent className="px-4 space-y-2">
              {view.faqs.map((f) => (
                <div key={f.question}>
                  <p className="text-sm font-medium">{f.question}</p>
                  <p className="text-sm text-muted-foreground">{f.answer}</p>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="science">
            <AccordionTrigger className="px-4 text-sm">Stain science, in plain language</AccordionTrigger>
            <AccordionContent className="px-4 space-y-1 text-sm text-muted-foreground">
              <p>{record.sciencePlain}</p>
              <p><span className="font-medium text-foreground">Heat:</span> {record.science.heat}</p>
              <p><span className="font-medium text-foreground">Ageing:</span> {record.science.ageing}</p>
              <p className="text-xs">{record.science.uncertainty}</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="identify">
            <AccordionTrigger className="px-4 text-sm">How to tell it apart</AccordionTrigger>
            <AccordionContent className="px-4 space-y-1 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Appearance:</span> {record.identification.appearance}</p>
              <p><span className="font-medium text-foreground">Texture:</span> {record.identification.texture}</p>
              {record.identification.similarLooking.length > 0 && (
                <p><span className="font-medium text-foreground">Often confused with:</span> {record.identification.similarLooking.join(", ")}</p>
              )}
              <ul className="list-disc pl-5">
                {record.identification.distinguishingQuestions.map((q) => <li key={q}>{q}</li>)}
              </ul>
              <p className="text-xs">{record.identification.photoLimitations}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {tech ? (
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Professional technical content</h2>
              <Button size="sm" variant="outline" onClick={() => setShowTechnical((v) => !v)}>
                {showTechnical ? "Hide" : "Show"}
              </Button>
            </div>
            {showTechnical && (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">{tech.detailedScience}</p>
                <div>
                  <p className="font-medium">Fabric risk matrix</p>
                  <ul className="text-muted-foreground list-disc pl-5">
                    {tech.fabricMatrix.map((f, i) => (
                      <li key={i}>
                        {FABRIC_LABEL[f.fabric as FabricKey] ?? String(f.fabric)} — {f.mainRisk}
                        {f.testRequired && " (test required)"}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Colour rules</p>
                  <ul className="text-muted-foreground list-disc pl-5">
                    {tech.colourMatrix.slice(0, 4).map((c) => (
                      <li key={c.colour}>{COLOUR_LABEL[c.colour]} — {c.mainRisk}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Treatment-principle sequence (placeholders)</p>
                  <ol className="text-muted-foreground list-decimal pl-5">
                    {tech.stageSequence.map((s) => <li key={s.stage}>{STAGE_LABEL[s.stage]} — stop: {s.stopCondition}</li>)}
                  </ol>
                </div>
                <p className="text-xs text-muted-foreground">Product mapping: {tech.productMapping}</p>
                <div>
                  <p className="font-medium">Claim-level evidence</p>
                  <ul className="text-muted-foreground list-disc pl-5">
                    {tech.evidence.map((e) => <li key={e.id}>[{e.section}] {e.claim} — {e.source} ({e.verification})</li>)}
                  </ul>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <p className="text-xs text-muted-foreground">
            Specialist procedures and product mapping are available to authorized professional roles only.
          </p>
        )}

        <p className="text-xs text-muted-foreground">{view.disclaimer}</p>
        <p className="text-xs text-muted-foreground">
          Expected outcome model: {OUTCOME_LABEL[record.expectedOutcomes[0]?.outcome ?? "uncertain"]} · Last reviewed {view.lastReviewed} · Content version {record.governance.contentVersion}
        </p>
      </div>
    </div>
  );
}
