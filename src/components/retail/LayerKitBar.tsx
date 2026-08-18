import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Briefcase, ChevronDown, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  GENERIC_KIT_OPTIONS, LAYER_UNAVAILABLE_MESSAGE, WORKING_LAYERS,
} from "@/data/retailSpotting";
import { useKitCompanies, useCompanyProducts } from "@/hooks/useSpottingKits";
import { useRetail } from "@/store/useRetail";

/** Compact working-level + spotting-kit control. Companies come from the database. */
export default function LayerKitBar() {
  const { layer, setLayer, kit, setKit, otherKitName, setOtherKitName } = useRetail();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const companies = useKitCompanies();
  const products = useCompanyProducts(kit.kind === "company" ? kit.companyId : null);

  const kitLabel =
    kit.kind === "company"
      ? kit.companyName
      : kit.kind === "basic"
        ? "Basic/domestic"
        : kit.kind === "other"
          ? otherKitName || "Other kit"
          : "No kit";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-border bg-card p-0.5" role="group" aria-label="Working level">
        {WORKING_LAYERS.map((l) => (
          <button
            key={l.key}
            type="button"
            aria-pressed={layer === l.key}
            onClick={() => {
              if (!l.available) {
                toast(LAYER_UNAVAILABLE_MESSAGE);
                return;
              }
              setLayer(l.key);
              navigate(l.key === "professional" ? "/professional-spotting" : l.key === "master" ? "/master-spotter" : "/retail-spotting");
            }}
            className={`min-h-[36px] rounded-full px-3 text-xs font-semibold transition-colors ${
              layer === l.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            } ${l.available ? "" : "opacity-60"}`}
          >
            {l.available ? l.label : `${l.label} · Coming later`}
          </button>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="min-h-[36px] gap-1.5 rounded-full">
            <Briefcase className="h-4 w-4" aria-hidden />
            <span className="max-w-[9rem] truncate">{kitLabel}</span>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4" aria-hidden /> Which spotting kit are you using?
            </SheetTitle>
            <SheetDescription>
              Companies and products are loaded from the approved database. Change the kit at any time.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            {companies.isLoading && <p className="text-sm text-muted-foreground">Loading companies…</p>}
            {companies.isError && (
              <p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                The company list is unavailable right now. You can still continue with a basic or unlisted kit.
              </p>
            )}
            {(companies.data ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setKit({ kind: "company", companyId: c.id, companyName: c.name, productIds: [] })}
                aria-pressed={kit.kind === "company" && kit.companyId === c.id}
                className={`min-h-[52px] w-full rounded-xl border p-3 text-left text-sm font-semibold transition-colors ${
                  kit.kind === "company" && kit.companyId === c.id ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                {c.name}
                <span className="block text-xs font-normal text-muted-foreground">Approved products only</span>
              </button>
            ))}

            {GENERIC_KIT_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() =>
                  setKit(o.key === "other" ? { kind: "other", kitName: otherKitName } : { kind: o.key === "basic" ? "basic" : "none" })
                }
                aria-pressed={kit.kind === o.key}
                className={`min-h-[52px] w-full rounded-xl border p-3 text-left text-sm font-semibold transition-colors ${
                  kit.kind === o.key ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                {o.label}
                <span className="block text-xs font-normal text-muted-foreground">{o.note}</span>
              </button>
            ))}
          </div>

          {kit.kind === "other" && (
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="other-kit">Kit name</Label>
              <Input
                id="other-kit"
                value={otherKitName}
                onChange={(e) => {
                  setOtherKitName(e.target.value);
                  setKit({ kind: "other", kitName: e.target.value });
                }}
                placeholder="Name of the kit in use"
              />
              <p className="text-xs text-muted-foreground">
                Product instructions are never invented. Follow the current product label or technical data sheet.
              </p>
            </div>
          )}

          {kit.kind === "company" && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">Products available to you</p>
              {products.isLoading && <p className="text-sm text-muted-foreground">Loading products…</p>}
              {!products.isLoading && (products.data ?? []).length === 0 && (
                <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  No approved product records exist for this company yet. Follow the current product label or technical
                  data sheet.
                </p>
              )}
              {(products.data ?? []).map((p) => {
                const selected = kit.productIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setKit({
                        ...kit,
                        productIds: selected ? kit.productIds.filter((id) => id !== p.id) : [...kit.productIds, p.id],
                      })
                    }
                    className={`min-h-[44px] w-full rounded-lg border p-2.5 text-left text-sm ${
                      selected ? "border-primary bg-primary/5 font-semibold" : "border-border bg-card"
                    }`}
                  >
                    {p.name}
                    {p.record.classification !== "production" && (
                      <span className="block text-xs text-muted-foreground">Under technical review</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <Button className="mt-5 min-h-[48px] w-full" onClick={() => setOpen(false)}>
            Done
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
