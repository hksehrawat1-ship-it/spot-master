import { Link } from "react-router-dom";
import { AlertTriangle, Ban, CloudOff, FileClock, Loader2, Lock, ShieldAlert, UserCheck, Wrench } from "lucide-react";

/**
 * Plain-language interface states for the hardened architecture.
 * No internal terminology (tables, RLS, JSON, engines, API errors) reaches the user.
 */

type PanelProps = { title: string; body: string; icon: React.ElementType; tone?: "neutral" | "warn" | "stop"; action?: React.ReactNode };

function Panel({ title, body, icon: Icon, tone = "neutral", action }: PanelProps) {
  const toneClass =
    tone === "stop"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : tone === "warn"
        ? "border-accent/40 bg-accent/10 text-foreground"
        : "border-border bg-card text-foreground";
  return (
    <section role="status" className={`m-4 rounded-2xl border p-5 ${toneClass}`}>
      <Icon aria-hidden className="h-6 w-6" />
      <h2 className="mt-2 font-serif text-base font-bold">{title}</h2>
      <p className="mt-1 text-sm opacity-90">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </section>
  );
}

export function LoadingState({ label = "Checking your access…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 p-10 text-sm text-muted-foreground">
      <Loader2 aria-hidden className="h-6 w-6 animate-spin text-primary" />
      {label}
    </div>
  );
}

export function SignInRequiredState() {
  return (
    <Panel
      icon={Lock}
      title="Please sign in"
      body="You need to sign in before you can open this part of Stain Master."
      action={
        <Link to="/sign-in" className="inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Go to sign in
        </Link>
      }
    />
  );
}

export function SessionExpiredState() {
  return (
    <Panel
      icon={UserCheck}
      title="Your session has ended"
      body="For your safety you were signed out. Please sign in again to continue."
      action={
        <Link to="/sign-in" className="inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Sign in again
        </Link>
      }
    />
  );
}

export function AccessDeniedState({ what = "this area" }: { what?: string }) {
  return (
    <Panel
      icon={ShieldAlert}
      tone="stop"
      title="Access denied"
      body={`Your account does not have permission to open ${what}. Ask an administrator if you need this access.`}
      action={
        <Link to="/stain-master" className="inline-block rounded-full border border-current px-4 py-2 text-sm font-semibold">
          Back to Stain Master
        </Link>
      }
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Panel
      icon={CloudOff}
      tone="warn"
      title="We cannot reach Stain Master right now"
      body="Your connection or our service is temporarily unavailable. Saved guidance is not shown while we cannot confirm it is current."
      action={
        onRetry && (
          <button onClick={onRetry} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Try again
          </button>
        )
      }
    />
  );
}

export function UnderReviewState() {
  return (
    <Panel
      icon={FileClock}
      tone="warn"
      title="Content under technical review"
      body="This information has not been approved by a technical reviewer yet, so it is not shown. Please check back later."
    />
  );
}

export function SafetyCheckUnavailableState() {
  return (
    <Panel
      icon={Wrench}
      tone="stop"
      title="Safety check unavailable"
      body="We could not run the safety check, so no treatment steps can be shown. Please try again shortly, or treat this item as professional-only."
    />
  );
}

export function TreatmentBlockedState({ reason }: { reason: string }) {
  return <Panel icon={Ban} tone="stop" title="Treatment blocked" body={reason} />;
}

export function ProfessionalRequiredState({ reason = "This item needs a trained professional to assess it before any product is applied." }: { reason?: string }) {
  return <Panel icon={AlertTriangle} tone="warn" title="Professional assessment required" body={reason} />;
}

export function NoApprovedMethodState() {
  return (
    <Panel
      icon={FileClock}
      title="No approved method available"
      body="We do not yet have an approved, verified method for this combination. Nothing is shown rather than guessing, because the wrong product can damage the garment."
    />
  );
}

export function DemoDataBadge({ label = "Demonstration data" }: { label?: string }) {
  return (
    <span className="inline-block rounded-full border border-accent/50 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground">
      {label}
    </span>
  );
}
