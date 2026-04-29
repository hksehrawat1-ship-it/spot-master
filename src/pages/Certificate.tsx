import { Link, useParams } from "react-router-dom";
import { Download, ArrowLeft } from "lucide-react";
import { getCourse } from "@/data/courses";
import { useApp } from "@/store/useApp";
import { useProgress } from "@/lib/progress";
import { toast } from "sonner";
import cert1 from "@/assets/certificates/cert-c1.jpg";
import cert2 from "@/assets/certificates/cert-c2.jpg";
import cert3 from "@/assets/certificates/cert-c3.jpg";

const CERT_BG: Record<string, string> = {
  c1: cert1,
  c2: cert2,
  c3: cert3,
};

// Certificate ID — deterministic per (user, course) so it stays the same
function makeCertId(courseId: string, email: string) {
  let h = 0;
  const s = `${courseId}|${email}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const code = h.toString(36).toUpperCase().padStart(8, "0").slice(0, 8);
  return `GILM-${courseId.toUpperCase()}-${code}`;
}

export default function Certificate() {
  const { slug } = useParams();
  const course = slug ? getCourse(slug) : undefined;
  const { user } = useApp();
  const progress = useProgress(course ?? ({ id: "_", modules: [] } as any));

  if (!course || !user) {
    return (
      <div className="p-8 text-center">
        <Link to="/" className="text-primary underline">Go home</Link>
      </div>
    );
  }

  if (progress.pct < 100) {
    return (
      <div className="px-4 py-10 text-center">
        <h1 className="font-serif text-xl font-bold">Almost there!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete all lessons of {course.title} to unlock your certificate.
        </p>
        <Link to={`/courses/${course.slug}`} className="mt-5 inline-block rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Continue learning
        </Link>
      </div>
    );
  }

  const certId = makeCertId(course.id, user.email);
  const date = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  const bg = CERT_BG[course.id];

  const handleDownload = () => {
    toast.success("Use 'Save as PDF' in the print dialog");
    window.print();
  };

  return (
    <div className="px-3 py-4">
      <div className="mb-3 flex items-center justify-between print:hidden">
        <Link to={`/courses/${course.slug}`} className="inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-elevated"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </button>
      </div>

      {/* Certificate canvas — uses the uploaded PDF as background; we overlay
          the dynamic Date, ID and student Name at the marked positions. */}
      <div className="certificate-print mx-auto w-full max-w-[820px]">
        <div
          className="relative w-full overflow-hidden rounded-lg shadow-elevated"
          style={{ aspectRatio: "1 / 1.414" }}
        >
          <img src={bg} alt={`${course.title} certificate`} className="absolute inset-0 h-full w-full object-cover" />

          {/* DATE — top-left under "DATE:" label */}
          <div
            className="absolute font-semibold text-foreground"
            style={{ left: "8.5%", top: "6.2%", fontSize: "1.1cqw" }}
          >
            {date}
          </div>

          {/* Certificate ID — top-right under "Unique Certificate ID" */}
          <div
            className="absolute text-right font-semibold text-foreground"
            style={{ right: "8.5%", top: "6.2%", fontSize: "1.1cqw" }}
          >
            {certId}
          </div>

          {/* Student name — printed on the blue underline in the middle */}
          <div
            className="absolute left-0 right-0 text-center"
            style={{ top: "55%" }}
          >
            <span
              className="font-serif italic text-[hsl(214_71%_28%)]"
              style={{ fontSize: "3.2cqw", fontWeight: 600 }}
            >
              {user.name}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground print:hidden">
        Certificate ID: <span className="font-semibold">{certId}</span>
      </p>

      <style>{`
        @media print {
          body { background: white; }
          .certificate-print { max-width: 100% !important; }
        }
        .certificate-print > div { container-type: inline-size; }
      `}</style>
    </div>
  );
}
