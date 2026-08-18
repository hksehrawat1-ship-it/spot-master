import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import PhoneField, { findCountry, isValidNationalNumber } from "@/components/PhoneField";
import StatusNotice from "@/components/system/StatusNotice";
import { supabase } from "@/integrations/supabase/client";

export default function Register() {
  const navigate = useNavigate();
  const { status, sendEmailOtp, verifyEmailOtp } = useAuth();

  const [stage, setStage] = useState<"details" | "code">("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [national, setNational] = useState("");
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "signed_in") navigate("/setup", { replace: true });
  }, [status, navigate]);

  const validate = () => {
    const country = findCountry(countryCode);
    const next: Record<string, string> = {};
    if (fullName.trim().length < 2) next.fullName = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!isValidNationalNumber(country, national))
      next.phone = `Enter a valid ${country.name} mobile number (${country.lengths.join(" or ")} digits).`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;
    const country = findCountry(countryCode);

    setBusy(true);
    const res = await sendEmailOtp(email.trim(), fullName.trim(), `${country.dial}${national}`);
    setBusy(false);
    if (res.error) return toast.error(res.error);
    setStage("code");
    toast.success("We have emailed you a one-time code.");
  };

  const confirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 6) return toast.error("Enter the 6-digit code from your email.");

    setBusy(true);
    const res = await verifyEmailOtp(email.trim(), code);
    if (res.error) {
      setBusy(false);
      return toast.error(res.error);
    }

    const country = findCountry(countryCode);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("profiles").upsert(
        {
          user_id: data.user.id,
          full_name: fullName.trim(),
          country: country.code,
          phone_country_code: country.dial,
          phone_national_number: national,
          marketing_consent: consent,
          setup_step: 1,
        } as never,
        { onConflict: "user_id" },
      );
    }
    setBusy(false);
    toast.success("Account created.");
    navigate("/setup", { replace: true });
  };

  return (
    <div className="sm-container max-w-lg py-10">
      <h1>Create your Stain Master account</h1>
      <p className="mt-2 text-muted-foreground">
        Your account keeps your working level, spotting kit and cases in one place. No password needed — we send a
        one-time code to your email address.
      </p>

      {stage === "details" ? (
        <form onSubmit={requestCode} noValidate className="mt-8 space-y-5">
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium">
              Full name
            </label>
            <input
              id="fullName"
              autoComplete="name"
              className="sm-field"
              value={fullName}
              maxLength={80}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={Boolean(errors.fullName)}
            />
            {errors.fullName && <p className="mt-1.5 text-sm font-medium text-stop">{errors.fullName}</p>}
          </div>

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
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <p className="mt-1.5 text-sm font-medium text-stop">{errors.email}</p>}
          </div>

          <PhoneField
            countryCode={countryCode}
            national={national}
            onCountryChange={setCountryCode}
            onNationalChange={setNational}
            error={errors.phone}
          />

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-muted-foreground">
              Send me occasional product and safety updates. Optional, and you can stop at any time.
            </span>
          </label>

          <button type="submit" disabled={busy} className="sm-btn-primary w-full">
            {busy ? "Sending your code…" : "Email me a one-time code"}
          </button>

          <p className="text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to="/sign-in" className="text-primary underline">
              Sign in
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={confirmCode} noValidate className="mt-8 space-y-5">
          <StatusNotice tone="info" title="Check your email">
            We sent a 6-digit code to {email.trim()}. It expires shortly, so please enter it now.
          </StatusNotice>

          <div>
            <label htmlFor="code" className="mb-1.5 block text-sm font-medium">
              One-time code
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="sm-field tracking-[0.4em]"
              value={code}
              maxLength={8}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <button type="submit" disabled={busy} className="sm-btn-primary w-full">
            {busy ? "Confirming…" : "Confirm and create account"}
          </button>

          <div className="flex flex-wrap gap-4 text-sm">
            <button type="button" className="text-primary underline" disabled={busy} onClick={() => requestCode()}>
              Send a new code
            </button>
            <button
              type="button"
              className="text-muted-foreground underline"
              onClick={() => {
                setCode("");
                setStage("details");
              }}
            >
              Change my details
            </button>
          </div>
        </form>
      )}

      <StatusNotice tone="info" className="mt-8" title="Stain Master is decision support">
        Guidance is safety-first and does not guarantee complete stain removal. Fabric safety always takes priority.
      </StatusNotice>
    </div>
  );
}
