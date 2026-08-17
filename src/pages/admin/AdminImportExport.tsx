import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { EXPORT_KINDS, IMPORT_KINDS, IMPORT_TEMPLATES } from "@/data/adminWorkspace";
import type { ExportKind, ImportKind } from "@/data/adminWorkspace";
import { exportDataset } from "@/lib/adminEngine";
import { currentAdminUser, useAdmin } from "@/store/useAdmin";
import { useGovernance } from "@/store/useGovernance";

export default function AdminImportExport() {
  const admin = useAdmin();
  const user = useAdmin(currentAdminUser);
  const gov = useGovernance();
  const [kind, setKind] = useState<ImportKind>("stains");
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");
  const [exportKind, setExportKind] = useState<ExportKind>("stain_database");

  const runImport = () => {
    const lines = csv.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return setMessage("Paste a header row and at least one data row.");
    const columns = lines[0].split(",").map((c) => c.trim());
    const rows = lines.slice(1).map((line) => {
      const cells = line.split(",");
      return Object.fromEntries(columns.map((c, i) => [c, (cells[i] ?? "").trim()]));
    });
    const preview = admin.previewImport(kind, columns, rows);
    const batch = admin.commitImport(preview, user.userId);
    setMessage(`${batch.accepted} row(s) created as Draft, ${batch.rejected} rejected. Import never publishes.`);
  };

  const runExport = () => {
    const rows = gov.records.map((r) => ({ id: r.stableId, title: r.title, status: r.status, version: r.currentVersion }));
    const res = exportDataset(exportKind, user, rows);
    setMessage(res.message);
  };

  return (
    <AdminShell section="import_export" title="Import and export">
      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-serif text-base font-bold">Bulk import (drafts only)</h2>
        <select value={kind} onChange={(e) => setKind(e.target.value as ImportKind)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
          {IMPORT_KINDS.map((k) => <option key={k} value={k}>{k.replace(/_/g, " ")}</option>)}
        </select>
        <p className="mt-1 text-[11px] text-muted-foreground">Template columns: {IMPORT_TEMPLATES[kind].join(", ")}</p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={5}
          aria-label="CSV rows"
          className="mt-2 w-full rounded-xl border border-input bg-background p-3 font-mono text-xs"
        />
        <button onClick={runImport} className="mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
          Preview and import as drafts
        </button>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-serif text-base font-bold">Export</h2>
        <select value={exportKind} onChange={(e) => setExportKind(e.target.value as ExportKind)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
          {EXPORT_KINDS.map((k) => <option key={k} value={k}>{k.replace(/_/g, " ")}</option>)}
        </select>
        <p className="mt-1 text-[11px] text-muted-foreground">Exports respect your role, organization and privacy rules.</p>
        <button onClick={runExport} className="mt-2 w-full rounded-full border border-border py-2.5 text-sm font-semibold">Export</button>
      </section>

      {message && <p role="status" className="mt-3 rounded-xl bg-secondary p-3 text-sm">{message}</p>}

      <section className="mt-4">
        <h2 className="font-serif text-base font-bold">Recent import batches</h2>
        <ul className="mt-2 space-y-2 text-xs">
          {admin.imports.map((b) => (
            <li key={b.batchId} className="rounded-xl border border-border bg-card p-3">
              {b.batchId} · {b.kind} · accepted {b.accepted} · rejected {b.rejected}
            </li>
          ))}
          {admin.imports.length === 0 && <li className="text-sm text-muted-foreground">No imports yet.</li>}
        </ul>
      </section>
    </AdminShell>
  );
}
