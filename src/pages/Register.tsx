import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import PhoneField, { findCountry, isValidNationalNumber } from "@/components/PhoneField";
import StatusNotice from "@/components/system/StatusNotice";
import { supabase } from "@/integrations/supabase/client";

export default function Register() {
  const navigate = useNavigate();
  const { status, signUpWithPassword, user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [national, setNational] = useState("");
  const [consent, setConsent] = useState(false);
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
    if (password.length < 8) next.password = "Use a password of at least 8 characters.";
    if (!isValidNationalNumber(country, national))
      next.phone = `Enter a valid ${country.name} mobile number (${country.lengths.join(" or ")} digits).`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const country = findCountry(countryCode);

    setBusy(true);
    const res = await signUpWithPassword(email.trim(), password, fullName.trim(), `${country.dial}${national}`);
    if (res.error) {
      setBusy(false);
      return toast.error(res.error);
    }

    // Store workspace-facing details when the session is created immediately.
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
    navigate(user || data.user ? "/setup" : "/sign-in", { replace: true });
  };

  return (
    <div className="sm-container max-w-lg py-10">
      <h1>Create your Stain Master account</h1>
      <p className="mt-2 text-muted-foreground">
        Your account keeps your working level, spotting kit and cases in one place.
      </p>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
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

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="sm-field"
            value={password}
            maxLength={72}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password ? (
            <p className="mt-1.5 text-sm font-medium text-stop">{errors.password}</p>
          ) : (
            <p className="mt-1.5 text-sm text-muted-foreground">At least 8 characters.</p>
          )}
        </div>

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
          {busy ? "Creating your account…" : "Create account"}
        </button>

        <p className="text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to="/sign-in" className="text-primary underline">
            Sign in
          </Link>
        </p>
      </form>

      <StatusNotice tone="info" className="mt-8" title="Stain Master is decision support">
        Guidance is safety-first and does not guarantee complete stain removal. Fabric safety always takes priority.
      </StatusNotice>
    </div>
  );
}
