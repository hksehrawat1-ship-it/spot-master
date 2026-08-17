/** STEP 6 — administrator stain editor, governance dashboard, export and test suite. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useMasterStains } from "@/store/useMasterStains";
import {
  searchStains, detectDuplicates, validateForPublication, sectionCompletion,
  exportCsv, exportRow, EXPORT_COLUMNS, allocateStainId,
} from "@/lib/masterStainEngine";
import { runMasterStainScenarios } from "@/lib/masterStainScenarios";
import { RECORD_STATUS_LABEL, REVIEW_TRIGGER_LABEL } from "@/data/masterStains";
import type { RecordStatus, ReviewTrigger } from "@/data/masterStains";
import { CATEGORY_LABEL } from "@/data/stainKnowledge";
import { CheckCircle2, XCircle, Download } from "lucide-react";

const STATUS_FLOW: RecordStatus[] = ["draft", "under_review", "approved", "published", "needs_review", "suspended", "archived"];

export default function MasterStainAdmin() {
  const store = useMasterStains();
  const all = store.all();
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string>(all[0]?.key ?? "");
  const [newName, setNewName] = useState("");
  const [reason, setReason] = useState("");
  const [results, setResults] = useState<ReturnType<typeof runMasterStainScenarios> | null>(null);

  const hits = useMemo(() => searchStains(query, all, { includeAllStatuses: true, limit: 40 }), [query, all]);
  const record = all.find((s) => s.key === selectedKey) ?? all[0];
  const validation = record ? validateForPublication(record) : [];
  const completion = record ? sectionCompletion(record) : [];
  const dupes = newName.trim() ? detectDuplicates(newName, [], all) : [];
  const flags = record ? store.reviewFlags[record.key] ?? [] : [];

  const download = () => {
    const blob = new Blob([exportCsv(all)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "master-stain-database.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Excel-ready export downloaded");
  };

  return (
    <div className="p-4 pb-24 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Master Stain Database</h1>
        <p className="text-sm text-muted-foreground">
          {all.length} master records · next Stain ID {allocateStainId(all)}
        </p>
      </div>

      <Tabs defaultValue="library">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>

        {/* ---------------- Library ---------------- */}
        <TabsContent value="library" className="space-y-3 pt-3">
          <Input placeholder="Search all statuses: name, alias, local name, misspelling, Stain ID…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="space-y-2">
            {hits.map((h) => (
              <Card
                key={h.stain.key}
                className="p-3 cursor-pointer"
                onClick={() => setSelectedKey(h.stain.key)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {h.stain.icon} {h.stain.canonicalName}
                      {h.stain.canonicalOf && <span className="text-muted-foreground"> · variant</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {h.stain.stainId} · {CATEGORY_LABEL[h.stain.primaryCategory]} · matched {h.matchType} “{h.matchedOn}”
                    </p>
                  </div>
                  <Badge variant={h.stain.governance.status === "published" ? "default" : "secondary"}>
                    {RECORD_STATUS_LABEL[h.stain.governance.status]}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-3 space-y-2">
            <p className="font-medium text-sm">Create a new stain (duplicate check first)</p>
            <Input placeholder="Proposed stain name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            {dupes.length > 0 && (
              <div className="space-y-1">
                {dupes.map((d, i) => (
                  <p key={i} className="text-xs text-amber-700">
                    {d.reason} Suggested action: <strong>{d.suggestion.replace(/_/g, " ")}</strong>
                    {d.safetyCritical && " — safety-critical, reviewer decision required before any merge."}
                  </p>
                ))}
              </div>
            )}
            <Button
              size="sm"
              disabled={!newName.trim()}
              onClick={() => {
                if (dupes.some((d) => d.safetyCritical)) {
                  toast.error("Conflicting safety-critical records found. Send for reviewer decision instead of merging.");
                  return;
                }
                const d = store.createDraft(newName.trim());
                setSelectedKey(d.key);
                setNewName("");
                toast.success(`Draft created as ${d.stainId}`);
              }}
            >
              Create draft
            </Button>
          </Card>
        </TabsContent>

        {/* ---------------- Editor ---------------- */}
        <TabsContent value="editor" className="space-y-3 pt-3">
          {record && (
            <>
              <Card className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{record.icon} {record.canonicalName}</p>
                  <Badge>{RECORD_STATUS_LABEL[record.governance.status]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {record.stainId} · version {record.governance.contentVersion} · owner {record.governance.contentOwner} · reviewer {record.governance.technicalReviewer ?? "not assigned"}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {record.aliases.slice(0, 8).map((a) => (
                    <Badge key={a.alias} variant="outline" className="text-[10px]">{a.alias} · {a.type.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
                <Link className="text-xs text-primary underline" to={`/stain/${record.key}`}>Preview public view</Link>
              </Card>

              <Card className="p-3 space-y-2">
                <p className="font-medium text-sm">Section completion</p>
                <div className="grid grid-cols-2 gap-1">
                  {completion.map((c) => (
                    <p key={c.section} className="text-xs flex items-center gap-1">
                      {c.complete ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-destructive" />}
                      {c.section}
                    </p>
                  ))}
                </div>
              </Card>

              <Card className="p-3 space-y-2">
                <p className="font-medium text-sm">Publication validation</p>
                {validation.map((v) => (
                  <p key={v.rule} className="text-xs flex gap-1">
                    {v.ok ? <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />}
                    <span><span className="font-medium">{v.rule}</span> — {v.detail}</span>
                  </p>
                ))}
              </Card>

              <Card className="p-3 space-y-2">
                <p className="font-medium text-sm">Workflow</p>
                <Textarea placeholder="Reason for revision" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
                <div className="flex flex-wrap gap-2">
                  {STATUS_FLOW.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={record.governance.status === s ? "default" : "outline"}
                      onClick={() => {
                        if (s === "published" && validation.some((v) => !v.ok)) {
                          toast.error("Cannot publish: unresolved validation rules.");
                          return;
                        }
                        store.setStatus(record.key, s, "Administrator", reason || `Status set to ${RECORD_STATUS_LABEL[s]}`);
                        toast.success(`${record.stainId} → ${RECORD_STATUS_LABEL[s]}`);
                      }}
                    >
                      {RECORD_STATUS_LABEL[s]}
                    </Button>
                  ))}
                </div>
              </Card>

              <Card className="p-3 space-y-2">
                <p className="font-medium text-sm">Review triggers</p>
                <div className="flex flex-wrap gap-2">
                  {(["sds_changed", "label_changed", "new_fabric_restriction", "repeated_failures", "better_evidence", "treatment_suspended"] as ReviewTrigger[]).map((t) => (
                    <Button key={t} size="sm" variant="outline" onClick={() => { store.flagReview(record.key, { [t]: `${REVIEW_TRIGGER_LABEL[t]} reported by administrator` }); toast.success("Sections flagged for review"); }}>
                      {REVIEW_TRIGGER_LABEL[t]}
                    </Button>
                  ))}
                </div>
                {flags.length > 0 && (
                  <div className="space-y-1">
                    {flags.map((f, i) => (
                      <p key={i} className="text-xs text-amber-700">{REVIEW_TRIGGER_LABEL[f.trigger]} → sections: {f.sections.join(", ")} ({f.date})</p>
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => store.clearFlags(record.key)}>Clear flags</Button>
                  </div>
                )}
              </Card>

              <Card className="p-3 space-y-1">
                <p className="font-medium text-sm">Revision history</p>
                {record.revisions.map((r) => (
                  <div key={`${r.version}-${r.date}`} className="text-xs text-muted-foreground flex items-center justify-between gap-2">
                    <span>v{r.version} · {r.date} · {RECORD_STATUS_LABEL[r.status]} · {r.reason}</span>
                    <Button size="sm" variant="ghost" onClick={() => { store.restoreVersion(record.key, r.version); toast.success(`Restored v${r.version} as a draft`); }}>Restore</Button>
                  </div>
                ))}
              </Card>
            </>
          )}
        </TabsContent>

        {/* ---------------- Export ---------------- */}
        <TabsContent value="export" className="space-y-3 pt-3">
          <Button onClick={download} className="w-full"><Download className="h-4 w-4 mr-2" />Download Excel-ready CSV</Button>
          <div className="overflow-x-auto rounded-lg border">
            <table className="text-[10px] min-w-[900px]">
              <thead className="bg-muted">
                <tr>{EXPORT_COLUMNS.map((c) => <th key={c} className="p-1 text-left whitespace-nowrap">{c}</th>)}</tr>
              </thead>
              <tbody>
                {all.slice(0, 12).map((s) => {
                  const row = exportRow(s);
                  return (
                    <tr key={s.key} className="border-t align-top">
                      {EXPORT_COLUMNS.map((c) => <td key={c} className="p-1 max-w-[160px] truncate">{row[c]}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Product columns stay “Under Review” and domestic treatment stays “Domestic treatment is not recommended.” until Step 7 approvals exist.
          </p>
        </TabsContent>

        {/* ---------------- Tests ---------------- */}
        <TabsContent value="tests" className="space-y-3 pt-3">
          <Button onClick={() => setResults(runMasterStainScenarios(all))} className="w-full">Run Step 6 test scenarios</Button>
          {results && (
            <>
              <p className="text-sm font-medium">{results.filter((r) => r.pass).length}/{results.length} passing</p>
              {results.map((r) => (
                <Card key={r.id} className="p-3">
                  <p className="text-sm flex items-start gap-2">
                    {r.pass ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
                    <span><span className="font-medium">{r.id}</span> — {r.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground pl-6">{r.detail}</p>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
