import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, User as UserIcon, ArrowLeft, Check, ShieldCheck, Sparkles } from "lucide-react";
import { useApp, ADMIN_EMAIL, DEMO_STUDENT } from "@/store/useApp";
import { toast } from "sonner";
import logo from "@/assets/gilm-logo.png";

export default function SignIn() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const unlock = useApp((s) => s.unlockStainMaster);
  const [step, setStep] = useState<"details" | "otp" | "pay">("details");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter your name");
    if (!/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) return toast.error("Enter a valid phone number");
    if (!email.includes("@")) return toast.error("Enter a valid email");
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
    setPhone(phone || "+91 98765 43210");
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
    toast.success(`Verified. Welcome, ${name}!`);
    if (role === "admin") return navigate("/admin");
    setStep("pay");
  };

  const pay = async () => {
    unlock({ name, email: email.toLowerCase(), phone });
    toast.success("Payment successful — Stain Master unlocked 🎉");
    navigate("/stain-master");
  };

  return (
    <div className="px-5 py-6">
      <button
        onClick={() => (step === "details" ? navigate(-1) : setStep(step === "pay" ? "otp" : "details"))}
        className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="text-center">
        <img src={logo} alt="Stain Master" className="mx-auto h-16 w-16 object-contain" />
        <h1 className="mt-3 text-2xl font-bold text-primary">
          {step === "details" ? "Welcome to Stain Master" : step === "otp" ? "Verify your number" : "Unlock Stain Master"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "details"
            ? "Sign in with OTP verification"
            : step === "otp"
              ? `Code sent to ${phone} & ${email}`
              : "One payment. Lifetime stain expertise."}
        </p>
      </div>

      {step === "details" && (
        <form onSubmit={sendOtp} className="mt-8 space-y-3">
          <Field label="Full name">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Your name" className="w-full rounded-xl border border-input bg-card py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </Field>
          <Field label="Phone number">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} placeholder="+91 98765 43210" className="w-full rounded-xl border border-input bg-card py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </Field>
          <Field label="Email address">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} placeholder="you@example.com" className="w-full rounded-xl border border-input bg-card py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </Field>
          <button type="submit" className="mt-3 w-full rounded-full gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-elevated">
            Send OTP
          </button>
          <button type="button" onClick={useDemoStudent} className="w-full rounded-full border border-primary/30 bg-primary/5 py-3 text-xs font-semibold text-primary">
            Use demo student → {DEMO_STUDENT.name}
          </button>
        </form>
      )}

      {step === "otp" && (
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
            Verify & continue
          </button>
          <button type="button" onClick={sendOtp as any} className="w-full text-center text-xs font-semibold text-primary">
            Resend OTP
          </button>
        </form>
      )}

      {step === "pay" && (
        <div className="mt-6 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
            <div className="gradient-primary p-5 text-primary-foreground">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider opacity-90">
                <Sparkles className="h-4 w-4" /> Stain Master · Lifetime
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-extrabold">₹6,000</span>
                <span className="pb-1 text-sm line-through opacity-70">₹18,000</span>
              </div>
              <p className="mt-2 inline-block rounded-md bg-[hsl(140_70%_18%)] px-2.5 py-1 text-[12px] font-extrabold text-[hsl(140_85%_88%)]">
                Only ₹500 per month — to save you from costly stain mistakes
              </p>
            </div>
            <ul className="space-y-1.5 p-5 text-xs text-muted-foreground">
              {[
                "Full stain library with pro SOPs",
                "Identification & diagnosis flow",
                "Expert mode: pH, chemistry, fiber reaction",
                "Save stains & treatment history",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={pay} className="w-full rounded-full gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-elevated">
            Pay ₹6,000 & unlock
          </button>
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure payment · Lifetime access
          </p>
          <button onClick={() => navigate("/stain-master")} className="w-full text-center text-xs font-semibold text-primary">
            Skip for now
          </button>
        </div>
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
