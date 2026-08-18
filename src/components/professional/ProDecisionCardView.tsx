import {
  AlertOctagon, AlertTriangle, CheckCircle2, FileText, Info, ShieldAlert, Beaker, Droplets, Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NO_BRAND_EQUIVALENCE_NOTE } from "@/data/professionalSpotting";
import { PRO_STATUS_LABEL, PRO_STATUS_TONE, type ProDecisionCard } from "@/lib/professionalEngine";

const TONE_CLASS: Record<string, string> = {
  green: "border-success bg-success/10 text-success",
  amber: "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  red: "border-destructive bg-destructive/10 text-destructive",
  neutral: "border-border bg-muted text-muted-foreground",
};

const TONE_ICON = { green: CheckCircle2, amber: AlertTriangle, red: AlertOctagon, neutral: Info } as const;

function Section({ n, title, icon: Icon, children }: { n: number; title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" aria-hidden />} {n}. {title}
      </p>
      <div className="mt-2 text-sm">{children}</div>
    </Card>
  );
}

export default function ProDecisionCardView({ card }: { card: ProDecisionCard }) {
  const tone = PRO_STATUS_TONE[card.status];
  const Icon = TONE_ICON[tone];

  return (
    <div className="space-y-3">
      <Card className={`border-2 p-4 ${TONE_CLASS[tone]}`} role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-6 w-6 shrink-0" aria-hidden />
          <div>
            <p className="text-lg font-bold leading-tight">{PRO_STATUS_LABEL[card.status]}</p>
            <p className="mt-1 text-sm opacity-90">{card.statusMessage}</p>
          </div>
        </div>
      </Card>

      <Section n={2} title="Fabric-risk summary">
        <p>{card.fabricRisk.summary}</p>
        {card.fabricRisk.unknownPathway && (
          <p className="mt-1 font-semibold">Unknown-fabric pathway: {card.fabricRisk.unknownPathway}</p>
        )}
      </Section>

      <Section n={3} title="Stain-component assessment">
        <p className="font-semibold">{card.componentPlan.label}</p>
        <p className="text-muted-foreground">{card.componentPlan.message}</p>
        {card.componentPlan.entries.length > 0 && (
          <ol className="mt-2 space-y-1">
            {card.componentPlan.entries.map((e) => (
              <li key={e.order} className={e.component === card.activeComponent?.key ? "font-semibold text-primary" : ""}>
                Component {e.order}: {e.componentLabel} — stage {e.stageNumber} ({e.stageLabel})
              </li>
            ))}
            <li className="text-muted-foreground">Final stage: {card.componentPlan.finalStage}</li>
          </ol>
        )}
      </Section>

      <Section n={4} title="Selected kit and eligible product">
        <p className="font-semibold">{card.kit.label}</p>
        <p>{card.product ? card.product.productName : "No eligible product is shown for this stage and condition."}</p>
        {card.product?.verifiedPurpose && <p className="text-muted-foreground">Verified purpose: {card.product.verifiedPurpose}</p>}
        <p className="mt-1 text-xs text-muted-foreground">{NO_BRAND_EQUIVALENCE_NOTE}</p>
      </Section>

      <Section n={5} title="Source and verification status" icon={FileText}>
        <p>Source: {card.verification.source}</p>
        <p>Document version: {card.verification.version}</p>
        <Badge variant="outline" className="mt-1">{card.verification.status}</Badge>
      </Section>

      <Section n={6} title="Test requirement" icon={Beaker}>
        <p>{card.fabricRisk.testRequired ? "A concealed-area or colourfastness test is required." : "No further test is required for this case."}</p>
        <ul className="mt-1 text-xs text-muted-foreground">
          {card.fabricRisk.locations.map((l) => <li key={l}>• {l}</li>)}
        </ul>
      </Section>

      <Section n={7} title="Application instructions">
        {card.instructions.length === 0 ? (
          <p className="text-muted-foreground">No application instructions are shown while this case is not cleared.</p>
        ) : (
          <dl className="space-y-1">
            {card.instructions.map((i) => (
              <div key={i.label} className="flex gap-2">
                <dt className="w-40 shrink-0 text-muted-foreground">{i.label}</dt>
                <dd className="font-medium">{i.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Section>

      <Section n={8} title="PPE">
        <ul>{card.ppe.map((p) => <li key={p}>• {p}</li>)}</ul>
      </Section>

      <Card className="border-destructive/40 bg-destructive/5 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
          <ShieldAlert className="h-4 w-4" aria-hidden /> 9. Prohibited combinations
        </p>
        <ul className="mt-2 space-y-1 text-sm text-destructive">
          {card.prohibited.map((p) => <li key={p}>• {p}</li>)}
        </ul>
      </Card>

      <Section n={10} title="Rinse, flush or neutralisation" icon={Droplets}>
        <p>{card.rinseRequirement}</p>
        <p className="mt-1 text-xs text-muted-foreground">Transition check: {card.transition.message}</p>
      </Section>

      <Section n={11} title="Inspection checkpoint" icon={Eye}>
        <p>{card.inspectionCheckpoint}</p>
      </Section>

      <Section n={12} title="Next eligible action">
        <ul>{card.nextActions.map((a) => <li key={a}>• {a}</li>)}</ul>
      </Section>

      <Section n={13} title="Expected outcome">
        <p>{card.expectedOutcome}</p>
      </Section>

      <Section n={14} title="Escalation conditions">
        {card.escalation.triggers.length === 0 ? (
          <p className="text-muted-foreground">No escalation trigger is active.</p>
        ) : (
          <ul>{card.escalation.triggers.map((t) => <li key={t.key}>• {t.label}</li>)}</ul>
        )}
      </Section>

      {card.basicAlternative && (
        <Card className="border-amber-500/50 bg-amber-500/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            {card.basicAlternative.label}
          </p>
          <p className="mt-1 text-sm font-semibold">{card.basicAlternative.title}</p>
          <ol className="mt-1 space-y-1 text-sm">
            {card.basicAlternative.steps.map((s, i) => <li key={s}>{i + 1}. {s}</li>)}
          </ol>
        </Card>
      )}
    </div>
  );
}
