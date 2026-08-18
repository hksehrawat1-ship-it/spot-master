import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import LayerKitBar from "@/components/retail/LayerKitBar";
import MasterCasePanel from "@/components/master/MasterCasePanel";
import MasterDiagnosisPanel from "@/components/master/MasterDiagnosisPanel";
import MasterEvidencePanel from "@/components/master/MasterEvidencePanel";
import MasterOutcomePanel from "@/components/master/MasterOutcomePanel";
import MasterPathwayPanel from "@/components/master/MasterPathwayPanel";
import MasterSafetyPanel from "@/components/master/MasterSafetyPanel";
import { MASTER_INTRO, MASTER_TABS, VIEW_MODES } from "@/data/masterSpotter";
import { buildMasterCard, MASTER_STATUS_LABEL } from "@/lib/masterEngine";
import { useProductTransitions, useVerifiedProducts } from "@/hooks/useProfessionalProducts";
import { useMaster } from "@/store/useMaster";
import { useProfessional } from "@/store/useProfessional";
import { useRetail } from "@/store/useRetail";

/**
 * LAYER 3 — Master Spotter workspace.
 * Three coordinated panels on tablet/desktop, one task per screen with tabs on mobile.
 */
export default function MasterSpotter() {
  const { current, tab, setTab, view, setView, adoptCase, saveStatus, setKits, preferredKits } = useMaster();
  const retail = useRetail();
  const professional = useProfessional();

  // Changing the working level must never clear the active case.
  useEffect(() => {
    retail.setLayer("master");
    adoptCase({ ...retail.current, ...professional.current, kit: retail.kit });
    if (preferredKits.length === 0 && retail.kit.kind === "company") setKits([retail.kit]);
    else if (preferredKits.length) setKits(preferredKits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const companyId = current.selectedKits.find((k) => k.kind === "company") as { companyId?: string } | undefined;
  const products = useVerifiedProducts(companyId?.companyId ?? (current.kit.kind === "company" ? current.kit.companyId : null));
  const transitions = useProductTransitions();

  const dataUnavailable = products.isError || transitions.isError;
  useEffect(() => {
    if (dataUnavailable && current.technicalDataAvailable) useMaster.getState().patch({ technicalDataAvailable: false });
  }, [dataUnavailable, current.technicalDataAvailable]);

  const card = useMemo(
    () =>
      buildMasterCard(current, {
        products: products.data ?? [],
        transitions: transitions.data ?? [],
      }),
    [current, products.data, transitions.data],
  );

  const panels: Record<string, JSX.Element> = {
    case: <MasterCasePanel />,
    diagnosis: <MasterDiagnosisPanel />,
    pathway: <MasterPathwayPanel products={products.data ?? []} transitions={transitions.data ?? []} card={card} />,
    safety: <MasterSafetyPanel card={card} />,
    evidence: <MasterEvidencePanel card={card} />,
    outcome: <MasterOutcomePanel />,
  };

  return (
    <div className="pb-24">
      <Helmet>
        <title>Master Spotter — advanced stain treatment workspace</title>
        <meta
          name="description"
          content="Master Spotter: advanced, evidence-controlled stain treatment workspace with verified chemistry pathways, transition safety and full case records."
        />
      </Helmet>

      <header className="sticky top-0 z-30 space-y-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-base font-black tracking-tight">Stain Master · Master Spotter</h1>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-muted px-2 py-1 font-semibold">
              Case {current.caseId ? current.caseId.slice(0, 8) : "unsaved"}
            </span>
            <span className="text-muted-foreground">{saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Not saved" : "Draft"}</span>
          </div>
        </div>
        <LayerKitBar />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              card.status === "proceed"
                ? "bg-emerald-600/15 text-emerald-700"
                : card.status === "test_required"
                  ? "bg-amber-500/15 text-amber-700"
                  : "bg-destructive/15 text-destructive"
            }`}
          >
            {MASTER_STATUS_LABEL[card.status]}
          </p>
          <div className="flex items-center gap-1 rounded-full border border-border p-0.5" role="group" aria-label="View mode">
            {VIEW_MODES.map((v) => (
              <button
                key={v.key}
                type="button"
                aria-pressed={view === v.key}
                onClick={() => setView(v.key)}
                className={`min-h-[32px] rounded-full px-3 text-xs font-semibold ${
                  view === v.key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <p className="px-4 pt-3 text-xs text-muted-foreground">{MASTER_INTRO}</p>

      {/* Mobile: one task per screen */}
      <div className="lg:hidden">
        <nav className="sticky top-[124px] z-20 flex gap-1 overflow-x-auto border-b border-border bg-background px-4 py-2" aria-label="Master Spotter sections">
          {MASTER_TABS.map((t) => (
            <Button
              key={t.key}
              size="sm"
              variant={tab === t.key ? "default" : "ghost"}
              className="min-h-[36px] rounded-full text-xs"
              aria-current={tab === t.key ? "page" : undefined}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </nav>
        <div className="px-4 py-4">{panels[tab]}</div>
      </div>

      {/* Tablet and desktop: three coordinated panels */}
      <div className="hidden gap-4 px-4 py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Case facts</h2>
          <MasterCasePanel />
          <MasterDiagnosisPanel />
        </div>
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Treatment pathway</h2>
          <MasterPathwayPanel products={products.data ?? []} transitions={transitions.data ?? []} card={card} />
          <MasterOutcomePanel />
        </div>
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Safety and evidence</h2>
          <MasterSafetyPanel card={card} />
          <MasterEvidencePanel card={card} />
        </div>
      </div>
    </div>
  );
}
