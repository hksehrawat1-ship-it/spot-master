/**
 * Product administration — canonical, database-backed.
 * Approval runs through the server-side `approve_product_version` function, which
 * enforces the publication gate. The client cannot set an approved status directly.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAccess } from "@/auth/useAccess";
import { useCatalogProducts, useInvalidateCatalog } from "@/hooks/useProductCatalog";
import { approveVersion, readinessForVersion, STATUS_LABEL } from "@/lib/productCatalog";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function ProductAdmin() {
  const access = useAccess();
  const isMaintainer = access.productDrafts;
  const products = useCatalogProducts();
  const invalidate = useInvalidateCatalog();

  const [query, setQuery] = useState("");
  const [reason, setReason] = useState("");
  const [blockers, setBlockers] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products.data ?? []).filter((p) =>
      !q ? true : [p.name, p.productRef, p.companyName].join(" ").toLowerCase().includes(q),
    );
  }, [products.data, query]);

  if (!isMaintainer) {
    return (
      <div className="space-y-3 p-4 pb-24">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Product library
        </Link>
        <Card className="space-y-1 border-amber-500/40 p-4">
          <div className="flex items-center gap-2 text-amber-600">
            <ShieldAlert className="h-4 w-4" />
            <p className="text-sm font-semibold">Maintainer access only</p>
          </div>
          <p className="text-sm">Product records can only be changed by an authorised content maintainer.</p>
        </Card>
      </div>
    );
  }

  const check = async (versionId: string) => {
    setBusy(versionId);
    const res = await readinessForVersion(versionId);
    setBlockers((b) => ({ ...b, [versionId]: res.blockers }));
    setBusy(null);
    toast[res.ready ? "success" : "error"](res.ready ? "Ready for approval." : "Publication gate not met.");
  };

  const approve = async (versionId: string, target: "approved" | "published") => {
    if (reason.trim().length < 10) return toast.error("A written reason is required for every approval.");
    setBusy(versionId);
    const res = await approveVersion(versionId, target, reason.trim());
    setBusy(null);
    setBlockers((b) => ({ ...b, [versionId]: res.blockers }));
    if (res.ok) {
      toast.success(`Version ${target}.`);
      setReason("");
      invalidate();
    } else {
      toast.error(res.blockers[0] ?? "Approval refused by the publication gate.");
    }
  };

  return (
    <div className="pb-24">
      <div className="space-y-2 bg-gradient-to-br from-primary/15 to-accent/10 p-4">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Product library
        </Link>
        <h1 className="text-xl font-bold">Product administration</h1>
        <p className="text-xs text-muted-foreground">
          {rows.length} product records · approval is server-enforced and requires documents, safety data and a reason
        </p>
      </div>

      <div className="space-y-3 p-4">
        <Input placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />

        <Card className="space-y-2 p-4">
          <p className="text-sm font-semibold">Approval reason (recorded in the audit log)</p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Cite the document, section and reason for approving this version."
          />
        </Card>

        <div className="grid gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/admin/kit-onboarding">Open kit onboarding workflow</Link>
          </Button>
        </div>

        {products.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        <div className="space-y-3">
          {rows.map((p) => {
            const v = p.currentVersion;
            return (
              <Card key={p.id} className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/products/${p.productRef}`} className="font-semibold hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {p.productRef} · {p.companyName}
                    </p>
                  </div>
                  <Badge variant={p.approved ? "default" : "secondary"}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </Badge>
                </div>

                {!v ? (
                  <p className="text-xs text-muted-foreground">No version record — create one before approval.</p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Version {v.version_ref} · {v.country} · {STATUS_LABEL[v.approval_status] ?? v.approval_status}
                      {v.immutable ? " · immutable" : ""}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" disabled={busy === v.id} onClick={() => check(v.id)}>
                        Check publication gate
                      </Button>
                      <Button size="sm" disabled={busy === v.id || v.immutable} onClick={() => approve(v.id, "approved")}>
                        Approve version
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy === v.id}
                        onClick={() => approve(v.id, "published")}
                      >
                        Publish version
                      </Button>
                    </div>
                    {(blockers[v.id] ?? []).length > 0 && (
                      <ul className="list-disc space-y-0.5 pl-5 text-[11px] text-destructive">
                        {blockers[v.id].map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
