import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, Phone, User as UserIcon, ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/gilm-logo.png";
import { useAuth } from "@/auth/AuthProvider";
import { LoadingState } from "@/components/system/StatusStates";

/**
 * Real authentication only (Constitution R17).
 * No fixed OTP, no demo credential, no email address that grants authority.
 * Roles are resolved from the protected user_roles table after sign-in.
 */
export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, signInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/stain-master";

  useEffect(() => {
    if (status === "signed_in") navigate(from, { replace: true });
  }, [status, from, navigate]);

  if (status === "loading") return <LoadingState label="Loading…" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Enter a valid email address");
    if (password.length < 8) return toast.error("Use a password of at least 8 characters");
    if (mode === "signup" && !name.trim()) return toast.error("Enter your name");

    setBusy(true);
    const res =
      mode === "signin"
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password, name.trim(), phone.trim());
    setBusy(false);

    if (res.error) return toast.error(res.error);
    if (mode === "signup") {
      toast.success("Account created. If we ask you to confirm your email, please do that first.");
      setMode("signin");
      return;
    }
    toast.success("Signed in");
    navigate(from, { replace: true });
  };

  return (
    <div className="px-5 py-6">
      <button
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="text-center">
        <img src={logo} alt="Stain Master" className="mx-auto h-16 w-16 object-contain" />
        <h1 className="mt-3 text-2xl font-bold text-primary">
          {mode === "signin" ? "Sign in to Stain Master" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stain Master gives safety-first guidance. It does not guarantee stain removal.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`rounded-full py-2 text-xs font-semibold ${
              mode === m ? "bg-primary text-primary-foreground" : "text-secondary-foreground"
            }`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-3">
        {mode === "signup" && (
          <>
            <Field label="Full name">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Your name" className="w-full rounded-xl border border-input bg-card py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </Field>
            <Field label="Phone number (optional)">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} placeholder="+91…" className="w-full rounded-xl border border-input bg-card py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </Field>
          </>
        )}
        <Field label="Email address">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} placeholder="you@example.com" className="w-full rounded-xl border border-input bg-card py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </Field>
        <Field label="Password">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={72}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-input bg-card py-3 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="mt-3 w-full rounded-full gradient-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-elevated disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" /> Your access level is set by an administrator after sign-in.
      </p>
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
