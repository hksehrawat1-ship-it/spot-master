import { COUNTRIES, type Country } from "@/data/countries";

export function findCountry(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

export function isValidNationalNumber(country: Country, national: string): boolean {
  const digits = national.replace(/\D/g, "");
  return country.lengths.includes(digits.length);
}

export default function PhoneField({
  countryCode,
  national,
  onCountryChange,
  onNationalChange,
  id = "phone",
  error,
}: {
  countryCode: string;
  national: string;
  onCountryChange: (code: string) => void;
  onNationalChange: (value: string) => void;
  id?: string;
  error?: string;
}) {
  const country = findCountry(countryCode);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        Mobile number
      </label>
      <div className="flex gap-2">
        <select
          aria-label="Country dialling code"
          value={countryCode}
          onChange={(e) => onCountryChange(e.target.value)}
          className="sm-field w-[150px] flex-none"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.dial}
            </option>
          ))}
        </select>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={national}
          onChange={(e) => onNationalChange(e.target.value.replace(/\D/g, "").slice(0, 15))}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          className="sm-field flex-1"
          placeholder={"0".repeat(country.lengths[0])}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-stop">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted-foreground">
          {country.name}: {country.lengths.join(" or ")} digits after {country.dial}.
        </p>
      )}
    </div>
  );
}
