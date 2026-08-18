import { Download, Smartphone } from "lucide-react";
import { useInstallPrompt } from "@/pwa/useInstallPrompt";
import StatusNotice from "@/components/system/StatusNotice";

export default function Install() {
  const { canPrompt, install, installed } = useInstallPrompt();

  return (
    <div className="sm-container max-w-2xl py-10">
      <h1>Install Stain Master</h1>
      <p className="mt-2 text-muted-foreground">
        Add Stain Master to your device so it opens like an application on the shop floor.
      </p>

      {installed ? (
        <StatusNotice tone="proceed" className="mt-6" title="Stain Master is installed on this device" />
      ) : canPrompt ? (
        <button type="button" onClick={() => void install()} className="sm-btn-primary mt-6">
          <Download aria-hidden className="h-4 w-4" /> Install Stain Master
        </button>
      ) : (
        <StatusNotice tone="info" className="mt-6" title="Install from your browser menu">
          Your browser has not offered an install button yet. Use the browser menu and choose “Add to Home Screen” or
          “Install app”.
        </StatusNotice>
      )}

      <div className="sm-card mt-8">
        <h2 className="flex items-center gap-2 text-lg">
          <Smartphone aria-hidden className="h-5 w-5 text-primary" /> What installing does
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Opens Stain Master full screen, without browser controls.</li>
          <li>Keeps you signed in to your workspace.</li>
          <li>
            Safety-critical guidance still requires a connection. When you are offline, Stain Master tells you plainly
            rather than showing information that may be out of date.
          </li>
        </ul>
      </div>
    </div>
  );
}
