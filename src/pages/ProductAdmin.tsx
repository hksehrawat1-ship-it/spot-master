/** STEP 7 — administrator product editor, inventory and audit governance. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useProducts } from "@/store/useProducts";
import { useApp } from "@/store/useApp";
import {
  currentVersion, documentsFor, evaluateScorecard, detectConflicts, detectIdentityConflicts,
  exportProductsCsv, canPublishExtraction, isSafetyCritical, kitsForProduct,
  OVERALL_LABEL, SCORECARD_CHECKS, SCORECARD_LABEL,
} from "@/lib/productEngine";
import { PRODUCT_STATUS_LABEL, DOCUMENT_TYPE_LABEL } from "@/data/professionalProducts";
import { runProductScenarios } from "@/lib/productScenarios";
import { ArrowLeft, Download, ShieldAlert } from "lucide-react";

export default function ProductAdmin() {
  const store = useProducts();
  const user = useApp((s) => s.user);
  const by = user?.email ?? "admin";

  const products = useMemo(() => store.products(), [store.productOverrides, store.customProducts]);
  const companies = useMemo(() => store.companies(), [store.companyOverrides, store.customCompanies]);
  const kits = useMemo(() => store.kits(), [store.kitOverrides, store.customKits]);
  const documents = useMemo(() => store.documents(), [store.documentOverrides, store.customDocuments]);

  const cardFor = useMemo(() => {
    const cache = new Map<string, ReturnType<typeof evaluateScorecard>>();
    return (p: (typeof products)[number]) => {
      if (!cache.has(p.key)) {
        const v = currentVersion(p);
        const docs = documentsFor(p, documents);
        cache.set(p.key, evaluateScorecard(p, v, docs, companies.find((c) => c.key === p.companyKey), detectConflicts(p, v, docs)));
      }
      return cache.get(p.key)!;
    };
  }, [products, companies, documents]);

  const [selectedKey, setSelectedKey] = useState(products[0]?.key ?? "");
  const selected = products.find((p) => p.key === selectedKey) ?? products[0];
  const [reason, setReason] = useState("");
  const [tests, setTests] = useState<{ passed: number; total: number; failures: string[] } | null>(null);

  const identityConflicts = useMemo(() => detectIdentityConflicts(products), [products]);

  const exportCsv = () => {
    const csv = exportProductsCsv(products, companies, cardFor);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "stain-master-products.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const runTests = () => {
    const r = runProductScenarios();
    setTests({ passed: r.passed, total: r.total, failures: r.results.filter((x) => !x.pass).map((x) => x.name) });
  };

  const update = (patch: Record<string, unknown>, change?: string) => {
    if (!selected) return;
    const err = store.updateProduct(selected.key, patch, { by, reason, change });
    if (err) toast.error(err);
    else {
      toast.success("Change recorded in the audit history.");
      setReason("");
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="p-4 space-y-2">
        <p className="text-muted-foreground">Product administration is restricted to content maintainers.</p>
        <Link to="/products" className="text-primary underline">Back to the product library</Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-primary/15 to-accent/10 p-4 space-y-2">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Product library
        </Link>
        <h1 className="text-xl font-bold">Product administration</h1>
        <p className="text-xs text-muted-foreground">
          {companies.length} companies · {kits.length} kits · {products.length} products · {documents.length} documents
        </p>
      </div>

      <Tabs defaultValue="editor" className="p-4">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-3 pt-3">
          <div className="flex flex-wrap gap-2">
            {products.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedKey(p.key)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  p.key === selected?.key ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {p.displayName}
              </button>
            ))}
          </div>

          {selected && (
            <>
              <Card className="p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{selected.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {selected.productId} · {PRODUCT_STATUS_LABEL[selected.status]} ·{" "}
                      {kitsForProduct(selected.key, store.kitLinks, kits).map((k) => k.kitDisplayName).join(", ") || "no kit"}
                    </p>
                  </div>
                  <Badge variant="secondary">{OVERALL_LABEL[cardFor(selected).overall]}</Badge>
                </div>
                <Link to={`/products/${selected.key}`} className="text-xs text-primary underline">
                  Open product page
                </Link>
              </Card>

              <Card className="p-3 space-y-2 text-xs">
                <p className="text-sm font-semibold">Verification scorecard</p>
                {SCORECARD_CHECKS.map((c) => (
                  <div key={c} className="flex items-center justify-between border-b border-border/50 py-1">
                    <span>{SCORECARD_LABEL[c]}</span>
                    <span className={cardFor(selected).checks[c] ? "text-emerald-600" : "text-amber-600"}>
                      {cardFor(selected).checks[c] ? "Confirmed" : "Missing"}
                    </span>
                  </div>
                ))}
                {!!cardFor(selected).blockingReasons.length && (
                  <p className="flex items-start gap-1 pt-2 text-destructive">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {cardFor(selected).blockingReasons.join(" ")}
                  </p>
                )}
              </Card>

              <Card className="p-3 space-y-2">
                <p className="text-sm font-semibold">Record a change</p>
                <Textarea
                  placeholder="Written justification (required for company, chemistry, PPE, incompatibility, prohibited fabric or verified instruction changes)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => update({ status: "under_review" })}>
                    Send for review
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => update({ status: "published" }, "fully_verified")}>
                    Publish
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => update({ status: "suspended" })}>
                    Suspend
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      store.markDiscontinued(selected.key, new Date().toISOString().slice(0, 10), by);
                      toast.success("Marked discontinued. Historical records are retained.");
                    }}
                  >
                    Mark discontinued
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      if (!reason.trim()) return toast.error("A change summary is required for a new version.");
                      store.newVersion(selected.key, { country: currentVersion(selected).country, changeSummary: reason }, by);
                      setReason("");
                      toast.success("New immutable version created and set to draft.");
                    }}
                  >
                    New version
                  </Button>
                </div>
              </Card>

              <Card className="p-3 space-y-1 text-xs">
                <p className="text-sm font-semibold">Conflicts</p>
                {(() => {
                  const v = currentVersion(selected);
                  const list = [...detectConflicts(selected, v, documentsFor(selected, documents)),
                    ...identityConflicts.filter((c) => c.productKey === selected.key)];
                  return list.length ? list.map((c) => (
                    <p key={c.id} className="text-destructive">
                      {c.conflictType.replace(/_/g, " ")}{c.field ? ` — ${c.field}` : ""}
                    </p>
                  )) : <p className="text-muted-foreground">No conflicts detected.</p>;
                })()}
              </Card>
            </>
          )}

          <Button variant="outline" className="w-full rounded-full" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export product data (CSV)
          </Button>
        </TabsContent>

        <TabsContent value="documents" className="space-y-2 pt-3">
          {documents.map((d) => (
            <Card key={d.key} className="p-3 text-xs space-y-1">
              <p className="text-sm font-semibold">{d.title}</p>
              <p className="text-muted-foreground">
                {d.documentId} · {DOCUMENT_TYPE_LABEL[d.documentType]} · {d.state}
                {d.issuerUncertain ? " · issuer uncertain" : ""}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  store.supersede(d.key, "", by);
                  toast.success("Document superseded; affected product moved to needs review.");
                }}
              >
                Mark superseded
              </Button>
            </Card>
          ))}
          <Card className="p-3 text-xs space-y-1">
            <p className="text-sm font-semibold">Extractions awaiting confirmation</p>
            {store.extractions.length ? store.extractions.map((e) => (
              <div key={e.id} className="flex items-center justify-between border-b border-border/50 py-1">
                <span>
                  {e.field} {isSafetyCritical(e.field) ? "(safety critical)" : ""} —{" "}
                  {canPublishExtraction(e) ? "publishable" : "blocked"}
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => store.confirmExtraction(e.id, by)}>Confirm</Button>
                  <Button size="sm" variant="ghost" onClick={() => store.approveExtraction(e.id, by)}>Approve</Button>
                </div>
              </div>
            )) : <p className="text-muted-foreground">No pending extractions.</p>}
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-2 pt-3">
          <Card className="p-3 space-y-2 text-xs">
            <p className="text-sm font-semibold">Organization inventory</p>
            <p className="text-muted-foreground">
              Inventory is organization-specific and never changes the verified product record.
            </p>
            {store.inventory.map((i) => (
              <div key={i.id} className="border-b border-border/50 py-1">
                <p>{products.find((p) => p.key === i.productKey)?.displayName ?? i.productKey} · qty {i.quantity}</p>
                <p className="text-muted-foreground">
                  Batch {i.batchNumber ?? "—"} · expiry {i.expiryDate ?? "—"} ·{" "}
                  {i.approvedForUse ? "approved for use" : "not approved"}
                </p>
              </div>
            ))}
            <AddInventory
              productKeys={products.map((p) => ({ key: p.key, name: p.displayName }))}
              onAdd={(productKey, quantity, batchNumber) => {
                const p = products.find((x) => x.key === productKey)!;
                store.upsertInventory({
                  id: `inv-${Date.now()}`,
                  organizationKey: "org_default",
                  productKey,
                  productVersionKey: p.currentVersionKey,
                  quantity,
                  batchNumber,
                  approvedForUse: false,
                  staffPermissions: [],
                  documentAvailability: "unknown",
                });
                toast.success("Inventory item added (not approved for use until reviewed).");
              }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-2 pt-3">
          {store.audit.length ? store.audit.map((a) => (
            <Card key={a.id} className="p-3 text-xs">
              <p className="font-medium">
                {a.action} · {a.entity} {a.entityKey} {a.safetyCritical && <span className="text-destructive">· safety critical</span>}
              </p>
              <p className="text-muted-foreground">{a.reason} — {a.changedBy} · {new Date(a.at).toLocaleString()}</p>
            </Card>
          )) : <p className="text-sm text-muted-foreground">No changes recorded yet.</p>}
        </TabsContent>

        <TabsContent value="tests" className="space-y-2 pt-3">
          <Button className="w-full rounded-full" onClick={runTests}>Run Step 7 test scenarios</Button>
          {tests && (
            <Card className="p-3 text-sm">
              <p className="font-semibold">{tests.passed}/{tests.total} scenarios passed</p>
              {tests.failures.map((f) => <p key={f} className="text-xs text-destructive">{f}</p>)}
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AddInventory({
  productKeys, onAdd,
}: { productKeys: { key: string; name: string }[]; onAdd: (k: string, q: number, b?: string) => void }) {
  const [productKey, setProductKey] = useState(productKeys[0]?.key ?? "");
  const [quantity, setQuantity] = useState("1");
  const [batch, setBatch] = useState("");
  return (
    <div className="space-y-2 pt-2">
      <div className="flex flex-wrap gap-1">
        {productKeys.map((p) => (
          <button
            key={p.key}
            onClick={() => setProductKey(p.key)}
            className={`rounded-full border px-2 py-1 text-[11px] ${
              p.key === productKey ? "border-primary bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" className="w-20" />
        <Input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="Batch number" />
        <Button size="sm" className="rounded-full" onClick={() => onAdd(productKey, Number(quantity) || 1, batch || undefined)}>
          Add
        </Button>
      </div>
    </div>
  );
}
