import { useId, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { HIGH_IMPACT_LABEL, MIN_REASON_LENGTH } from "@/data/adminWorkspace";
import type { HighImpactAction } from "@/data/adminWorkspace";
import { confirmHighImpact } from "@/lib/adminEngine";

type Props = {
  action: HighImpactAction;
  open: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  detail?: string;
};

/**
 * 38. High-impact confirmation: explicit acknowledgement + written reason.
 * Never a browser confirm() — this dialog is keyboard and screen-reader accessible.
 */
export default function ConfirmAction({ action, open, onCancel, onConfirm, detail }: Props) {
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const titleId = useId();
  const reasonId = useId();

  if (!open) return null;

  const submit = () => {
    const check = confirmHighImpact(action, reason, acknowledged);
    if (!check.ok) return setError(check.message);
    setError("");
    onConfirm(reason.trim());
    setReason("");
    setAcknowledged(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-md rounded-2xl bg-card p-5 shadow-elevated">
        <h2 id={titleId} className="flex items-center gap-2 font-serif text-lg font-bold">
          <AlertTriangle aria-hidden className="h-5 w-5 text-destructive" />
          {HIGH_IMPACT_LABEL[action]}
        </h2>
        {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}

        <label htmlFor={reasonId} className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Written reason (minimum {MIN_REASON_LENGTH} characters)
        </label>
        <textarea
          id={reasonId}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          aria-describedby={error ? `${reasonId}-error` : undefined}
          className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />

        <label className="mt-3 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>I understand this action is recorded in the immutable audit log and may affect live guidance.</span>
        </label>

        {error && (
          <p id={`${reasonId}-error`} role="alert" className="mt-3 rounded-lg bg-destructive/10 p-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold">
            Cancel
          </button>
          <button onClick={submit} className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
