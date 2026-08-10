import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { useApp, ADMIN_EMAIL, DEMO_STUDENT } from "@/store/useApp";
import { toast } from "sonner";
import logo from "@/assets/gilm-logo.png";

export default function SignIn() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Enter a valid email");
    if (!name.trim()) return toast.error("Enter your name");
    // Fixed OTP for the demo student so testing is friction-free
    const code =
      email.trim().toLowerCase() === DEMO_STUDENT.email
        ? DEMO_STUDENT.otp
        : Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(code);
    setStep("otp");
    toast.success(`Demo OTP: ${code}`, { duration: 8000 });
  };

  const useDemoStudent = () => {
    setName(DEMO_STUDENT.name);
    setEmail(DEMO_STUDENT.email);
    setSentOtp(DEMO_STUDENT.otp);
    setOtp("");
    setStep("otp");
    toast.success(`Demo OTP: ${DEMO_STUDENT.otp}`, { duration: 8000 });
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== sentOtp) return toast.error("Invalid OTP");
    const role = email.toLowerCase() === ADMIN_EMAIL ? "admin" : "student";
    setUser({ name, email: email.toLowerCase(), role });
    toast.success(`Welcome, ${name}!`);
    navigate(role === "admin" ? "/admin" : "/courses");
  };

  return (
    <div className="px-5 py-6">
      <button onClick={() => (step === "otp" ? setStep("email") : navigate(-1))} className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="text-center">
        <img src={logo} alt="GILM" className="mx-auto h-16 w-16 object-contain" />
        <h1 className="mt-3 font-serif text-2xl font-bold text-primary">
          {step === "email" ? "Welcome to GILM" : "Verify your email"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "email" ? "Sign in with email OTP" : `Code sent to ${email}`}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={sendOtp} className="mt-8 space-y-3">
          <Field label="Full name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </Field>
          <Field label="Email address">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-input bg-card py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </Field>
          <button type="submit" className="mt-3 w-full rounded-full gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-elevated">
            Send OTP
          </button>

          <button
            type="button"
            onClick={useDemoStudent}
            className="w-full rounded-full border border-primary/30 bg-primary/5 py-3 text-xs font-semibold text-primary"
          >
            Use demo student → {DEMO_STUDENT.name}
          </button>

          <p className="text-center text-[11px] text-muted-foreground">
            Demo student: <b>{DEMO_STUDENT.email}</b> · OTP <b>{DEMO_STUDENT.otp}</b>
            <br />
            Admin: <b>{ADMIN_EMAIL}</b>
          </p>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8 space-y-3">
          <Field label="6-digit OTP">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoFocus
              placeholder="••••••"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-center font-mono text-xl tracking-[0.6em] outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Field>
          <button type="submit" className="w-full rounded-full gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-elevated">
            Verify & sign in
          </button>
          <button type="button" onClick={sendOtp as any} className="w-full text-center text-xs font-semibold text-primary">
            Resend OTP
          </button>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
