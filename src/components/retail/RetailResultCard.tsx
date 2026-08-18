import {
  AlertOctagon, AlertTriangle, CheckCircle2, HelpCircle, Info, ListChecks, ShieldAlert, Beaker,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONCEALED_TEST_STEPS, NEXT_DECISIONS } from "@/data/retailSpotting";
import { STATUS_LABEL, STATUS_TONE, type RetailResult } from "@/lib/retailEngine";

const TONE_CLASS: Record<string, string> = {
  green: "border-success bg-success/10 text-success",
  amber: "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  red: "border-destructive bg-destructive/10 text-destructive",
  neutral: "border-border bg-muted text-muted-foreground",
};

const TONE_ICON = {
  green: CheckCircle2,
  amber: AlertTriangle,
  red: AlertOctagon,
  neutral: Info,
} as const;

export default function RetailResultCard({
  result,
  onChangeKit,
  onDecision,
  onEscalate,
}: {
  result: RetailResult;
  onChangeKit: () => void;
  onDecision: (key: string) => void;
  onEscalate: () => void;
}) {
  const tone = STATUS_TONE[result.status];
  const Icon = TONE_ICON[tone];

  return (
    <div className="space-y-4">
      {/* 1. Status */}
      <Card className={`border-2 p-4 ${TONE_CLASS[tone]}`} role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-6 w-6 shrink-0" aria-hidden />
          <div>
            <p className="text-lg font-bold leading-tight">{STATUS_LABEL[result.status]}</p>
            <p className="mt-1 text-sm opacity-90">{result.statusMessage}</p>
          </div>
        </div>
      </Card>

      {/* 2. Immediate action */}
      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Do this now</p>
        <p className="mt-1 text-sm font-medium">{result.immediateAction}</p>
      </Card>

      {/* Avoid — always above any treatment steps */}
      {result.avoid.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
            <ShieldAlert className="h-4 w-4" aria-hidden /> Avoid
          </p>
          <ul className="mt-2 space-y-1 text-sm text-destructive">
            {result.avoid.map((a) => (
              <li key={a}>• {a}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* 3. Stain */}
      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stain</p>
        <p className="mt-1 text-base font-bold">{result.stain.name}</p>
        <p className="text-xs text-muted-foreground">{result.stain.category}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold">
          <HelpCircle className="h-3.5 w-3.5" aria-hidden /> Identification: {result.stain.confidence}
        </p>
      </Card>

      {/* 4. Product */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</p>
            <p className="mt-1 text-sm">{result.product.message}</p>
          </div>
          <Button variant="outline" size="sm" className="min-h-[40px] shrink-0" onClick={onChangeKit}>
            Change kit
          </Button>
        </div>
      </Card>

      {/* 5. Concealed-area test */}
      <Card className="p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Beaker className="h-4 w-4" aria-hidden /> Concealed-area test
        </p>
        <p className="mt-1 text-sm font-medium">
          {result.test.required ? "Required before treatment." : "Not required for this case."} Recorded result:{" "}
          {result.test.recorded}.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Test only in a concealed area:</p>
        <ul className="mt-1 text-xs text-muted-foreground">
          {result.test.locations.map((l) => (
            <li key={l}>• {l}</li>
          ))}
        </ul>
        {result.test.required && (
          <ol className="mt-3 space-y-1.5 text-sm">
            {CONCEALED_TEST_STEPS.map((s, i) => (
              <li key={s} className="flex gap-2">
                <span className="font-bold text-primary">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* 6. Steps */}
      {result.steps.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</p>
          <ol className="mt-2 space-y-2 text-sm">
            {result.steps.map((s, i) => (
              <li key={s} className="flex gap-2">
                <span className="font-bold text-primary">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* 7. Check after every step */}
      <Card className="p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ListChecks className="h-4 w-4" aria-hidden /> Check after every step
        </p>
        <ul className="mt-2 grid grid-cols-2 gap-1 text-sm">
          {result.checks.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
      </Card>

      {/* 8. Expected outcome */}
      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected outcome</p>
        <p className="mt-1 text-sm font-medium">{result.expectedOutcome}</p>
        <p className="mt-1 text-xs text-muted-foreground">Stain removal is never guaranteed.</p>
      </Card>

      {/* 9. Next decision */}
      <Card className="space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next decision</p>
        {NEXT_DECISIONS.map((d) => (
          <Button
            key={d.key}
            variant="outline"
            className="min-h-[48px] w-full justify-start text-left"
            onClick={() => onDecision(d.key)}
          >
            {d.label}
          </Button>
        ))}
        <Button variant="destructive" className="min-h-[48px] w-full" onClick={onEscalate}>
          Escalate this case
        </Button>
      </Card>
    </div>
  );
}
