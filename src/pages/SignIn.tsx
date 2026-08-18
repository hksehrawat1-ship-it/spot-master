import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { LoadingState } from "@/components/system/StatusStates";
import StatusNotice from "@/components/system/StatusNotice";

/**
 * Real authentication only (Constitution R17).
 * No fixed OTP, no demo credential, no email address that grants authority.
 */
export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, signInWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/home";

  useEffect(() => {
    if (status === "signed_in") navigate(from, { replace: true });
  }, [status, from, navigate]);

  if (status === "loading") return <LoadingState label="Loading…" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Enter a valid email address");
    if (password.length < 8) return toast.error("Use a password of at least 8 characters");

    setBusy(true);
    const res = await signInWithPassword(email.trim(), password);
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success("Signed in");
    navigate(from, { replace: true });
  };

  return (
    <div className="sm-container max-w-md py-10">
      <h1>Sign in to Stain Master</h1>
      <p className="mt-2 text-muted-foreground">Continue with the account you registered.</p>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="sm-field"
            value={email}
            maxLength={255}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="sm-field"
            value={password}
            maxLength={72}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" disabled={busy} className="sm-btn-primary w-full">
          {busy ? "Please wait…" : "Sign in"}
        </button>
        <p className="text-sm text-muted-foreground">
          New to Stain Master?{" "}
          <Link to="/register" className="text-primary underline">
            Create an account
          </Link>
        </p>
      </form>

      <StatusNotice tone="info" className="mt-8" title="Access levels are set by an administrator">
        Administration areas remain protected after sign-in.
      </StatusNotice>
    </div>
  );
}
