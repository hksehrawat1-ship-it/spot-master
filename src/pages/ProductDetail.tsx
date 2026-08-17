/** STEP 7 — role-aware professional product detail page. */

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useProducts } from "@/store/useProducts";
import { useApp } from "@/store/useApp";
import {
  currentVersion, documentsFor, evaluateScorecard, detectConflicts, chemistryDisplay,
  textileSuitability, processPermission, instructionValue, professionalAccess, publicProductView,
  costPerTreatment, kitsForProduct, rankedDocuments, OVERALL_LABEL, SCORECARD_CHECKS, SCORECARD_LABEL,
} from "@/lib/productEngine";
import {
  TEXTILE_KEYS, COLOUR_TARGET_KEYS, COMPONENT_KEYS, PROCESS_KEYS, TARGET_LABEL, PROCESS_LABEL,
  PPE_LABEL, PPE_KEYS, DOCUMENT_TYPE_LABEL, DOCUMENT_STATE_LABEL, TRAINING_LABEL,
  PRODUCT_STATUS_LABEL, COMPANY_ROLE_LABEL, COMPANY_VERIFICATION_LABEL,
  NOT_DISCLOSED, INSUFFICIENT_INFO,
} from "@/data/professionalProducts";
import type { PpeKey, TrainingKey } from "@/data/professionalProducts";
import { AlertTriangle, ArrowLeft, ShieldAlert } from "lucide-react";

const Unverified = () => (
  <Badge variant="outline" className="border-amber-500/60 text-amber-600">Unverified</Badge>
);

export default function ProductDetail() {
  const { productKey } = useParams();
  const store = useProducts();
  const user = useApp((s) => s.user);
  const [country, setCountry] = useState<string | undefined>(undefined);

  const products = useMemo(() => store.products(), [store.productOverrides, store.customProducts]);
  const companies = useMemo(() => store.companies(), [store.companyOverrides, store.customCompanies]);
  const documents = useMemo(() => store.documents(), [store.documentOverrides, store.customDocuments]);

  const product = products.find((p) => p.key === productKey || p.productId === productKey);
  const [versionKey, setSelectedVersionKey] = useState<string | undefined>(undefined);

  if (!product) {
    return (
      <div className="p-4 space-y-2">
        <p className="text-muted-foreground">This product record was not found.</p>
        <Link to="/products" className="text-primary underline">Back to the product library</Link>
      </div>
    );
  }

  const company = companies.find((c) => c.key === product.companyKey);
  const selectedVersionKey = versionKey ?? product.currentVersionKey;
  const version = product.versions.find((v) => v.key === selectedVersionKey) ?? currentVersion(product);
  const docs = documentsFor(product, documents);
  const conflicts = detectConflicts(product, version, docs);
  const card = evaluateScorecard(product, version, docs, company, conflicts);

  const audience = user?.role === "admin" ? "technical_reviewer" : "domestic_user";
  const access = professionalAccess(audience, product, version, card, { country });
  const chem = chemistryDisplay(version.chemistry);
  const pub = publicProductView(product, company, card);
  const cost = costPerTreatment(version.cost);

  if (!access.showInstructions && audience === "domestic_user") {
    return (
      <div className="pb-24">
        <div className="bg-gradient-to-br from-primary/15 to-accent/10 p-4 space-y-2">
          <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Product library
          </Link>
          <h1 className="text-xl font-bold">{pub.name}</h1>
          <p className="text-xs text-muted-foreground">{pub.company}</p>
        </div>
        <div className="space-y-3 p-4">
          <Card className="border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            <p className="font-semibold">Professional product</p>
            <p className="text-muted-foreground">{pub.professionalOnly}</p>
          </Card>
          <Card className="p-3 text-sm space-y-1">
            <p><span className="text-muted-foreground">Intended use: </span>{pub.intendedCategory}</p>
            <p><span className="text-muted-foreground">Verification: </span>{pub.verificationStatus}</p>
          </Card>
          <p className="text-xs text-muted-foreground">
            Industrial procedures, machine instructions, dilution, neutralisation, hazardous-component handling,
            cost and internal notes are not available on this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-primary/15 to-accent/10 p-4 space-y-2">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Product library
        </Link>
        <div>
          <h1 className="text-xl font-bold">{product.displayName}</h1>
          <p className="text-xs text-muted-foreground">
            {product.productId} · {company?.displayName} · {PRODUCT_STATUS_LABEL[product.status]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{OVERALL_LABEL[card.overall]}</Badge>
          {product.provisional && <Unverified />}
        </div>
      </div>

      <div className="space-y-3 p-4">
        {!access.allowed && (
          <Card className="border-destructive/40 bg-destructive/5 p-3 space-y-1 text-sm">
            <p className="flex items-center gap-1 font-semibold text-destructive">
              <ShieldAlert className="h-4 w-4" /> Actionable instructions are blocked
            </p>
            <ul className="list-disc pl-5 text-xs text-muted-foreground">
              {access.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </Card>
        )}

        {!!product.reviewFlags.length && (
          <Card className="border-amber-500/40 bg-amber-500/5 p-3 text-xs space-y-1">
            <p className="flex items-center gap-1 font-semibold"><AlertTriangle className="h-4 w-4" /> Review flags</p>
            <ul className="list-disc pl-5 text-muted-foreground">
              {product.reviewFlags.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </Card>
        )}

        <Card className="p-3 text-sm space-y-1">
          <p className="font-semibold">Product identity</p>
          <p><span className="text-muted-foreground">Canonical name: </span>{product.canonicalName}</p>
          <p><span className="text-muted-foreground">Product code: </span>{product.productCode ?? INSUFFICIENT_INFO}</p>
          <p><span className="text-muted-foreground">Type / form: </span>{product.productType ?? INSUFFICIENT_INFO} · {product.physicalForm ?? INSUFFICIENT_INFO}</p>
          <p><span className="text-muted-foreground">Colour (supporting only): </span>{product.productColour ?? INSUFFICIENT_INFO}</p>
          <p><span className="text-muted-foreground">Odour: </span>{product.odourDescription ?? NOT_DISCLOSED}</p>
          <p><span className="text-muted-foreground">Previous names: </span>{product.previousNames.join(", ") || "—"}</p>
        </Card>

        <Card className="p-3 text-sm space-y-1">
          <p className="font-semibold">Company and kits</p>
          <p>{company?.displayName} · {COMPANY_VERIFICATION_LABEL[company?.verification ?? "unverified"]}</p>
          <p className="text-xs text-muted-foreground">
            Roles: {(company?.roles ?? []).map((r) => COMPANY_ROLE_LABEL[r]).join(", ") || "Not recorded"}
          </p>
          <p className="text-xs text-muted-foreground">
            Kits: {kitsForProduct(product.key, store.kitLinks, store.kits()).map((k) => k.kitDisplayName).join(", ") || "—"}
          </p>
          {!!company?.relationships.length && (
            <div className="rounded-md bg-muted/50 p-2 text-xs">
              {company.relationships.map((r) => (
                <p key={r.relatedCompanyName}>
                  <strong>Unverified claim:</strong> {r.claimText} ({r.claimSource})
                </p>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-3 text-sm space-y-2">
          <p className="font-semibold">Product version</p>
          <div className="flex flex-wrap gap-2">
            {product.versions.map((v) => (
              <button
                key={v.key}
                onClick={() => setSelectedVersionKey(v.key)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  v.key === selectedVersionKey ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {v.versionRef} · {v.country}{v.approvalStatus === "superseded" ? " (superseded)" : ""}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Formulation: {version.formulationIdentifier ?? INSUFFICIENT_INFO} · Label {version.labelVersion ?? "—"} ·
            SDS {version.sdsVersion ?? "—"} · TDS {version.tdsVersion ?? "—"}
          </p>
          {version.changeSummary && <p className="text-xs">{version.changeSummary}</p>}
        </Card>

        <Accordion type="multiple" className="space-y-2">
          <AccordionItem value="claims" className="rounded-lg border px-3">
            <AccordionTrigger className="text-sm">Intended-use claims</AccordionTrigger>
            <AccordionContent className="space-y-2 text-xs">
              {product.claims.length ? product.claims.map((c, i) => (
                <div key={i} className="rounded-md bg-muted/50 p-2">
                  <p><strong>Manufacturer claim:</strong> {c.claimedStain}</p>
                  <p className="text-muted-foreground">{c.sourceDescription}</p>
                  <p className="text-muted-foreground">Status: claimed, not independently verified</p>
                </div>
              )) : <p className="text-muted-foreground">{INSUFFICIENT_INFO}</p>}
              <p className="text-muted-foreground">
                Verified performance: {product.verifications.length
                  ? product.verifications.map((v) => `${v.claimedStain} (${v.verification})`).join(", ")
                  : "None. Manufacturer claims are not verified performance."}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="chem" className="rounded-lg border px-3">
            <AccordionTrigger className="text-sm">Active chemistry</AccordionTrigger>
            <AccordionContent className="space-y-1 text-xs">
              <p><span className="text-muted-foreground">Ingredients: </span>{chem.ingredients.join(", ")}</p>
              <p><span className="text-muted-foreground">Chemical family: </span>{chem.chemicalFamily}</p>
              <p><span className="text-muted-foreground">Solvent family: </span>{chem.solventFamily}</p>
              <p><span className="text-muted-foreground">pH: </span>{chem.ph}</p>
              <p><span className="text-muted-foreground">Flash point: </span>{chem.flashPoint}</p>
              <p><span className="text-muted-foreground">Surfactant type: </span>{chem.surfactantType}</p>
              <p><span className="text-muted-foreground">Hazardous components: </span>{chem.hazardousComponents.join(", ")}</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="textile" className="rounded-lg border px-3">
            <AccordionTrigger className="text-sm">Textile, colour and component compatibility</AccordionTrigger>
            <AccordionContent className="space-y-1 text-xs">
              {[...TEXTILE_KEYS, ...COLOUR_TARGET_KEYS, ...COMPONENT_KEYS].map((k) => {
                const r = textileSuitability(version, k);
                return (
                  <div key={k} className="flex items-center justify-between gap-2 border-b border-border/50 py-1">
                    <span>{TARGET_LABEL[k] ?? k}</span>
                    <span className={r.recorded ? "" : "text-amber-600"}>{r.label}</span>
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="process" className="rounded-lg border px-3">
            <AccordionTrigger className="text-sm">Cleaning-process compatibility</AccordionTrigger>
            <AccordionContent className="space-y-1 text-xs">
              {PROCESS_KEYS.map((k) => {
                const r = processPermission(version, k);
                return (
                  <div key={k} className="flex items-center justify-between gap-2 border-b border-border/50 py-1">
                    <span>{PROCESS_LABEL[k]}</span>
                    <span className={r.recorded ? "" : "text-amber-600"}>
                      {r.recorded ? r.permitted.replace(/_/g, " ") : "Process not established"}
                    </span>
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="instructions" className="rounded-lg border px-3">
            <AccordionTrigger className="text-sm">Verified application instructions</AccordionTrigger>
            <AccordionContent className="space-y-1 text-xs">
              {access.showInstructions ? (
                <>
                  <p><span className="text-muted-foreground">Dilution: </span>{instructionValue(version, "dilution")}</p>
                  <p><span className="text-muted-foreground">Contact time: </span>{instructionValue(version, "contactTime")}</p>
                  <p><span className="text-muted-foreground">Temperature: </span>{instructionValue(version, "temperature")}</p>
                  <p><span className="text-muted-foreground">Rinsing: </span>{instructionValue(version, "rinsing")}</p>
                  <p><span className="text-muted-foreground">Neutralization: </span>{instructionValue(version, "neutralization")}</p>
                  <p><span className="text-muted-foreground">Maximum attempts: </span>{instructionValue(version, "maximumAttempts")}</p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  {INSUFFICIENT_INFO} — instructions are withheld until the blocking requirements above are met.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ppe" className="rounded-lg border px-3">
            <AccordionTrigger className="text-sm">PPE, ventilation and hazards</AccordionTrigger>
            <AccordionContent className="space-y-1 text-xs">
              {PPE_KEYS.map((k: PpeKey) => {
                const row = version.ppe.find((p) => p.ppeKey === k);
                return (
                  <div key={k} className="flex items-center justify-between gap-2 border-b border-border/50 py-1">
                    <span>{PPE_LABEL[k]}</span>
                    <span className={row ? "" : "text-amber-600"}>
                      {row ? `${row.level.replace(/_/g, " ")}${row.material ? ` · ${row.material}` : ""}` : "Not established"}
                    </span>
                  </div>
                );
              })}
              <p className="pt-2 text-muted-foreground">
                Signal word: {version.safety.signalWord ?? NOT_DISCLOSED} · Hazard statements:{" "}
                {version.safety.hazardStatements.join("; ") || NOT_DISCLOSED}
              </p>
              <p className="text-muted-foreground">Storage: {version.safety.storage ?? NOT_DISCLOSED}</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="incompat" className="rounded-lg border px-3">
            <AccordionTrigger className="text-sm">Incompatibilities</AccordionTrigger>
            <AccordionContent className="space-y-1 text-xs">
              {version.incompatibilities.length ? version.incompatibilities.map((i, idx) => (
                <p key={idx}>{i.incompatibleWith} — {i.incompatibilityType} ({i.severity})</p>
              )) : (
                <p className="text-muted-foreground">
                  Not recorded. Do not assume products in a kit can be mixed.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pack" className="rounded-lg border px-3">
            <AccordionTrigger className="text-sm">Pack and country availability</AccordionTrigger>
            <AccordionContent className="space-y-1 text-xs">
              {version.packs.length ? version.packs.map((p, i) => (
                <p key={i}>
                  {p.packSize} {p.measurementUnit} {p.containerType}
                  {p.claimedOnly ? " — claimed, not label-verified" : ""}
                </p>
              )) : <p className="text-muted-foreground">{INSUFFICIENT_INFO}</p>}
              {version.countries.length ? version.countries.map((c) => (
                <p key={c.country}>
                  {c.country}: {c.marketStatus.replace(/_/g, " ")} · documents {c.documentCompleteness}
                  {c.countryMismatch ? " · COUNTRY MISMATCH" : ""}
                </p>
              )) : <p className="text-muted-foreground">Country applicability {INSUFFICIENT_INFO}</p>}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="docs" className="rounded-lg border px-3">
            <AccordionTrigger className="text-sm">Documents and evidence</AccordionTrigger>
            <AccordionContent className="space-y-1 text-xs">
              {rankedDocuments(docs).map((d) => (
                <div key={d.key} className="border-b border-border/50 py-1">
                  <p>{DOCUMENT_TYPE_LABEL[d.documentType]} — {d.title}</p>
                  <p className="text-muted-foreground">
                    {d.documentId} · issuer {d.issuer ?? "unknown"}{d.issuerUncertain ? " (uncertain)" : ""} ·
                    {" "}{DOCUMENT_STATE_LABEL[d.state]}
                  </p>
                </div>
              ))}
              {!docs.length && <p className="text-muted-foreground">No documents held.</p>}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="score" className="rounded-lg border px-3">
            <AccordionTrigger className="text-sm">Verification scorecard ({card.passed}/{card.total})</AccordionTrigger>
            <AccordionContent className="space-y-1 text-xs">
              {SCORECARD_CHECKS.map((c) => (
                <div key={c} className="flex items-center justify-between gap-2 border-b border-border/50 py-1">
                  <span>{SCORECARD_LABEL[c]}</span>
                  <span className={card.checks[c] ? "text-emerald-600" : "text-amber-600"}>
                    {card.checks[c] ? "Confirmed" : "Not confirmed"}
                  </span>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="training" className="rounded-lg border px-3">
            <AccordionTrigger className="text-sm">Training and cost</AccordionTrigger>
            <AccordionContent className="space-y-1 text-xs">
              {(Object.keys(version.training) as TrainingKey[]).map((k) => (
                <p key={k}>{TRAINING_LABEL[k]}: {version.training[k] ? "required" : "not required"}</p>
              ))}
              <p className="pt-2">
                <span className="text-muted-foreground">Cost per treatment: </span>{cost.message}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="history" className="rounded-lg border px-3">
            <AccordionTrigger className="text-sm">Revision history and conflicts</AccordionTrigger>
            <AccordionContent className="space-y-1 text-xs">
              {product.versions.map((v) => (
                <p key={v.key}>
                  {v.versionRef} · {v.country} · {v.approvalStatus}
                  {v.endDate ? ` · ended ${v.endDate}` : ""}
                </p>
              ))}
              {conflicts.length ? conflicts.map((c) => (
                <p key={c.id} className="text-destructive">
                  {c.conflictType.replace(/_/g, " ")}{c.field ? ` (${c.field})` : ""}
                </p>
              )) : <p className="text-muted-foreground">No conflicts detected.</p>}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {audience === "technical_reviewer" && (
          <Button asChild variant="outline" className="w-full rounded-full">
            <Link to="/admin/products">Open product administration</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
