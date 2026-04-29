import { Download, FileText, FileSpreadsheet, Image as ImageIcon, FileVideo, File, Lock, Vault } from "lucide-react";
import { useApp, type VaultItem } from "@/store/useApp";
import { toast } from "sonner";

const iconFor = (kind: VaultItem["kind"]) => {
  switch (kind) {
    case "pdf": return FileText;
    case "xlsx": return FileSpreadsheet;
    case "png": return ImageIcon;
    case "video": return FileVideo;
    case "doc": return FileText;
    default: return File;
  }
};

const fmtSize = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

export default function ResourceVault({ courseId }: { courseId: string }) {
  const { user, vault } = useApp();
  const items = vault.filter((v) => v.courseId === courseId);

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-center shadow-soft">
        <Vault className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-semibold">Resource Vault</p>
        <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" /> Sign in to access course resources
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <header className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
          <Vault className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h2 className="font-serif text-base font-bold leading-tight">Resource Vault</h2>
          <p className="text-[11px] text-muted-foreground">All downloadable resources for this course</p>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">{items.length}</span>
      </header>

      {items.length === 0 ? (
        <p className="rounded-xl bg-secondary/60 px-3 py-4 text-center text-xs text-muted-foreground">
          No resources uploaded yet. Check back soon.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => {
            const Icon = iconFor(r.kind);
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-2.5">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {r.kind} · {fmtSize(r.size)}
                  </p>
                </div>
                <button
                  onClick={() => toast.success(`Downloading ${r.name}`)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  aria-label={`Download ${r.name}`}
                >
                  <Download className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
