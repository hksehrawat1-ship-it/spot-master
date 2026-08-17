import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { DOCUMENT_TYPES } from "@/data/governance";
import type { GovDocumentType } from "@/data/governance";
import { validateUpload, uploadResultStatus } from "@/lib/adminEngine";
import type { UploadCandidate } from "@/lib/adminEngine";
import { useGovernance } from "@/store/useGovernance";

const BLANK: UploadCandidate = {
  fileName: "", mimeType: "application/pdf", fileHash: "", readable: true,
  passwordProtected: false, pageCount: 4, extractionQuality: 0.9,
  issuer: "", productName: "", productCode: "", country: "IN", language: "en",
  documentVersion: "", publicationDate: "",
};

export default function AdminDocuments() {
  const gov = useGovernance();
  const [candidate, setCandidate] = useState<UploadCandidate>(BLANK);
  const [docType, setDocType] = useState<GovDocumentType>("sds");
  const [submitted, setSubmitted] = useState(false);

  const checks = useMemo(() => validateUpload(candidate, gov.documents), [candidate, gov.documents]);
  const status = uploadResultStatus(checks);
  const set = (patch: Partial<UploadCandidate>) => setCandidate((c) => ({ ...c, ...patch }));

  return (
    <AdminShell section="documents" title="Source document centre">
      <p className="mt-3 rounded-xl bg-secondary p-3 text-xs">
        Uploading a document is never verification. Accepted files are stored as <strong>Uploaded — unverified</strong> until a
        documentation reviewer confirms the extracted claims.
      </p>

      <section aria-labelledby="upload" className="mt-4 space-y-2 rounded-2xl border border-border bg-card p-4">
        <h2 id="upload" className="font-serif text-base font-bold">Register a document</h2>
        <Row label="Document type">
          <select value={docType} onChange={(e) => setDocType(e.target.value as GovDocumentType)} className="input">
            {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </Row>
        <Row label="File name"><input className="input" value={candidate.fileName} onChange={(e) => set({ fileName: e.target.value })} /></Row>
        <Row label="File hash"><input className="input" value={candidate.fileHash} onChange={(e) => set({ fileHash: e.target.value })} /></Row>
        <Row label="Issuer"><input className="input" value={candidate.issuer} onChange={(e) => set({ issuer: e.target.value })} /></Row>
        <Row label="Product name"><input className="input" value={candidate.productName} onChange={(e) => set({ productName: e.target.value })} /></Row>
        <Row label="Product code"><input className="input" value={candidate.productCode} onChange={(e) => set({ productCode: e.target.value })} /></Row>
        <Row label="Country"><input className="input" value={candidate.country} onChange={(e) => set({ country: e.target.value })} /></Row>
        <Row label="Language"><input className="input" value={candidate.language} onChange={(e) => set({ language: e.target.value })} /></Row>
        <Row label="Document version"><input className="input" value={candidate.documentVersion} onChange={(e) => set({ documentVersion: e.target.value })} /></Row>
        <Row label="Publication date"><input type="date" className="input" value={candidate.publicationDate} onChange={(e) => set({ publicationDate: e.target.value })} /></Row>

        <button
          onClick={() => setSubmitted(true)}
          className="mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Validate and register
        </button>

        {submitted && (
          <div role="status" className="mt-2 space-y-1">
            <p className={`text-sm font-semibold ${status === "rejected" ? "text-destructive" : "text-emerald-700"}`}>
              {status === "rejected" ? "Rejected — resolve the issues below." : "Accepted as Uploaded — unverified."}
            </p>
            <ul className="space-y-1 text-xs">
              {checks.filter((c) => !c.ok).map((c) => (
                <li key={c.field} className="text-destructive">{c.field}: {c.message}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby="library" className="mt-5">
        <h2 id="library" className="font-serif text-base font-bold">Document library</h2>
        <ul className="mt-2 space-y-2">
          {gov.documents.map((d) => (
            <li key={d.documentId} className="rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-semibold">{d.documentType.replace(/_/g, " ")} · {d.issuer}</p>
              <p className="text-xs text-muted-foreground">
                {d.documentId} · v{d.documentVersion} · {d.country}/{d.language} · status {d.status}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">Linked records: {d.relatedTo.join(", ") || "none"}</p>
            </li>
          ))}
          {gov.documents.length === 0 && <li className="text-sm text-muted-foreground">No documents registered yet.</li>}
        </ul>
      </section>
    </AdminShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
      <div className="mt-1 [&_.input]:w-full [&_.input]:rounded-xl [&_.input]:border [&_.input]:border-input [&_.input]:bg-background [&_.input]:px-3 [&_.input]:py-2 [&_.input]:text-sm [&_.input]:font-normal [&_.input]:normal-case [&_.input]:tracking-normal [&_.input]:text-foreground">
        {children}
      </div>
    </label>
  );
}
