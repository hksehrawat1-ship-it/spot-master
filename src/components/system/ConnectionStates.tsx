import { useEffect, useState } from "react";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import { useInstallPrompt } from "@/pwa/useInstallPrompt";
import StatusNotice from "@/components/system/StatusNotice";

/** True when the browser reports no connection. */
export function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-caution-surface px-4 py-2 text-sm font-medium text-caution"
    >
      <WifiOff aria-hidden className="h-4 w-4" />
      You are offline. Previously viewed information may not be current.
    </div>
  );
}

/** Safety-critical guidance fails closed when verified information cannot be confirmed. */
export function OfflineSafetyGate({ children }: { children: React.ReactNode }) {
  const online = useOnlineStatus();
  if (online) return <>{children}</>;
  return (
    <StatusNotice tone="stop" title="Current verified guidance is unavailable">
      Do not begin a new chemical stage until the connection is restored.
    </StatusNotice>
  );
}

export function UpdateAvailableBanner({ onReload }: { onReload: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-center gap-3 bg-info-surface px-4 py-2 text-sm text-navy"
    >
      <span className="font-medium">Update available — a newer version of Stain Master is ready.</span>
      <button type="button" onClick={onReload} className="inline-flex items-center gap-1.5 font-semibold text-primary underline">
        <RefreshCw aria-hidden className="h-4 w-4" /> Reload now
      </button>
    </div>
  );
}

/** Non-intrusive install action. Never shown again after dismissal. */
export function InstallCard({ compact = false }: { compact?: boolean }) {
  const { canPrompt, installed, dismissed, isIos, install, dismiss } = useInstallPrompt();
  if (installed || dismissed) return null;
  if (!canPrompt && !isIos) return null;

  if (compact) {
    return (
      <button type="button" onClick={() => void install()} className="sm-btn-secondary h-10 min-h-[44px] px-3 text-sm">
        <Download aria-hidden className="h-4 w-4" /> Install
      </button>
    );
  }

  return (
    <section className="sm-card flex items-start gap-3" aria-label="Install Stain Master">
      <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full bg-secondary text-primary">
        <Download aria-hidden className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold">Install Stain Master</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add Stain Master to your device for faster access. No app-store download is required.
        </p>
        {canPrompt ? (
          <button type="button" onClick={() => void install()} className="sm-btn-primary mt-3 h-11 min-h-[44px] text-sm">
            Install Stain Master
          </button>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            On iPhone and iPad: open the Share menu, then choose <strong>Add to Home Screen</strong>.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install suggestion"
        className="rounded-full p-2 text-muted-foreground hover:bg-muted"
      >
        <X aria-hidden className="h-4 w-4" />
      </button>
    </section>
  );
}
