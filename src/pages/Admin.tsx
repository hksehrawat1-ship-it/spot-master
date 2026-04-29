import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Upload, Users, FileText, Video, Plus, Vault, Trash2, Download } from "lucide-react";
import { useApp, ADMIN_EMAIL, type VaultItem } from "@/store/useApp";
import { courses } from "@/data/courses";
import { toast } from "sonner";

const mockStudents = [
  { name: "Riya Sharma", email: "riya@example.com", enrolled: 3, completed: 12 },
  { name: "Arjun Mehta", email: "arjun@example.com", enrolled: 2, completed: 8 },
  { name: "Priya Nair", email: "priya@example.com", enrolled: 4, completed: 21 },
  { name: "Vikram Singh", email: "vikram@example.com", enrolled: 1, completed: 3 },
];

export default function Admin() {
  const { user } = useApp();
  const [tab, setTab] = useState<"upload" | "students" | "courses">("upload");

  if (!user || user.email !== ADMIN_EMAIL) return <Navigate to="/" replace />;

  return (
    <div className="space-y-5 px-4 py-5">
      <header className="rounded-2xl gradient-primary p-5 text-primary-foreground shadow-elevated">
        <p className="text-[11px] uppercase tracking-wider text-primary-foreground/80">Master admin</p>
        <h1 className="font-serif text-2xl font-bold">Dashboard</h1>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Mini label="Students" value={mockStudents.length + 142} />
          <Mini label="Courses" value={courses.length} />
          <Mini label="Files" value={48} />
        </div>
      </header>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {(["upload", "courses", "students"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "upload" && <UploadTab />}
      {tab === "students" && <StudentsTab />}
      {tab === "courses" && <CoursesTab />}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-background/15 p-2 backdrop-blur">
      <p className="font-serif text-lg font-bold">{value}</p>
      <p className="text-[9px] uppercase tracking-wider">{label}</p>
    </div>
  );
}

function UploadTab() {
  const [course, setCourse] = useState(courses[0].slug);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || files.length === 0) return toast.error("Add a title and at least one file");
    toast.success(`Demo: would upload ${files.length} file(s) to "${course}"`);
    setTitle("");
    setFiles([]);
  };

  return (
    <form onSubmit={handleUpload} className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
      <h2 className="font-serif text-lg font-bold">Upload lesson content</h2>
      <p className="text-xs text-muted-foreground">Videos, PDFs, XLSX, PNG — up to 500MB each.</p>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Course</span>
        <select value={course} onChange={(e) => setCourse(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
          {courses.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Lesson title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Module 4 — Pressing techniques" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
      </label>

      <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
        <Upload className="h-6 w-6 text-primary" />
        <span className="text-sm font-semibold text-primary">Tap to choose files</span>
        <span className="text-[11px] text-muted-foreground">video/mp4, pdf, xlsx, png</span>
        <input
          type="file"
          multiple
          accept="video/*,.pdf,.xlsx,.xls,.png,.jpg,.doc,.docx"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="hidden"
        />
      </label>

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-muted-foreground">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
            </li>
          ))}
        </ul>
      )}

      <button type="submit" className="w-full rounded-full gradient-primary py-3 text-sm font-semibold text-primary-foreground">
        Upload to course
      </button>
      <p className="text-center text-[10px] text-muted-foreground">
        Demo mode — enable Lovable Cloud to persist uploads.
      </p>
    </form>
  );
}

function StudentsTab() {
  return (
    <div className="space-y-2">
      <h2 className="font-serif text-lg font-bold">Students</h2>
      {mockStudents.map((s) => (
        <div key={s.email} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            {s.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{s.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{s.email}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Enrolled / Done</p>
            <p className="text-sm font-bold text-primary">{s.enrolled} / {s.completed}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CoursesTab() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold">Courses</h2>
        <button onClick={() => toast.info("Demo: create course flow")} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          <Plus className="h-3 w-3" /> New
        </button>
      </div>
      {courses.map((c) => (
        <div key={c.id} className="rounded-2xl bg-card p-3 shadow-soft">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 flex-none rounded-xl bg-gradient-to-br ${c.cover}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{c.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {c.modules.length} modules • {c.modules.reduce((a, m) => a + m.lessons.length, 0)} lessons
              </p>
            </div>
          </div>
          <div className="mt-2 flex gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1"><Video className="h-3 w-3" /> Videos</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1"><FileText className="h-3 w-3" /> Resources</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1"><Users className="h-3 w-3" /> {c.students}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
