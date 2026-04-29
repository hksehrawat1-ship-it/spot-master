import { Link, useParams } from "react-router-dom";
import { useRef } from "react";
import { Download, ArrowLeft } from "lucide-react";
import { getCourse } from "@/data/courses";
import { useApp } from "@/store/useApp";
import { useProgress } from "@/lib/progress";
import logo from "@/assets/gilm-logo.png";
import { toast } from "sonner";

export default function Certificate() {
  const { slug } = useParams();
  const course = slug ? getCourse(slug) : undefined;
  const { user } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const progress = course ? useProgress(course) : null;

  if (!course || !user) {
    return (
      <div className="p-8 text-center">
        <Link to="/" className="text-primary underline">Go home</Link>
      </div>
    );
  }

  if (!progress || progress.pct < 100) {
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

  const certId = `GILM-${course.id.toUpperCase()}-${user.email.split("@")[0].slice(0, 6).toUpperCase()}`;
  const date = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  const handleDownload = () => {
    // Simple print-to-PDF; user can save as PDF from browser
    toast.success("Use 'Save as PDF' in the print dialog");
    window.print();
  };

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center justify-between print:hidden">
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

      <div ref={ref} className="relative overflow-hidden rounded-3xl border-4 border-double border-primary bg-gradient-to-br from-background to-secondary p-6 shadow-elevated">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative text-center">
          <img src={logo} alt="GILM" className="mx-auto h-16 w-16 object-contain" />
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            Global Institute of Laundry Management
          </p>
          <p className="mt-6 font-serif text-xs uppercase tracking-widest text-muted-foreground">
            Certificate of Completion
          </p>
          <h1 className="mt-3 font-serif text-2xl font-bold text-primary">This is to certify that</h1>
          <p className="mt-3 font-serif text-3xl font-bold leading-tight">{user.name}</p>
          <p className="mt-4 text-sm text-foreground/80">has successfully completed the course</p>
          <p className="mt-2 font-serif text-lg font-semibold text-primary">{course.title}</p>

          <div className="mt-8 flex items-end justify-between text-left text-[10px]">
            <div>
              <p className="border-t border-foreground/40 pt-1 font-semibold">Date</p>
              <p className="text-muted-foreground">{date}</p>
            </div>
            <div className="text-right">
              <p className="border-t border-foreground/40 pt-1 font-semibold">Certificate ID</p>
              <p className="text-muted-foreground">{certId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
