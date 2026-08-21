import { useState } from "react";
import { z } from "zod";
import { Sparkles, Check, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/useApp";
import { usePricingPlan } from "@/hooks/usePricingPlan";
import { accessPeriodLabel, formatMoney, savingsMinor, savingsPercent } from "@/config/pricing";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Phone can only contain digits and + - ( )"),
});

const FEATURES = [
  "Full stain library with safety-first pathways",
  "Identification & diagnosis flow",
  "Expert mode: pH, chemistry, fiber reaction",
  "Save stains & treatment history",
];

export default function StainMasterPaywall({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const unlock = useApp((s) => s.unlockStainMaster);
  const { monthly, annual } = usePricingPlan();
  const [planChoice, setPlanChoice] = useState<"monthly" | "annual">("annual");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const plan = planChoice === "monthly" ? monthly : annual;
  const annualDiscount = savingsPercent(annual);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof typeof form;
        if (k && !fieldErrors[k]) fieldErrors[k] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    // Demo: simulate checkout
    await new Promise((r) => setTimeout(r, 700));
    unlock({ name: parsed.data.name!, email: parsed.data.email!, phone: parsed.data.phone! });
    setSubmitting(false);
    toast({
      title: "Welcome to Stain Master! 🎉",
      description: `${planChoice === "annual" ? "Annual" : "Monthly"} access activated.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm overflow-hidden p-0">
        <div className="bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider opacity-90">
            <Sparkles className="h-4 w-4" /> Stain Master · Founding price
          </div>
          <DialogHeader className="space-y-1 p-0 text-left">
            <DialogTitle className="text-2xl font-bold leading-tight text-primary-foreground">
              Unlock Stain Master
            </DialogTitle>
            <DialogDescription className="text-sm text-primary-foreground/90">
              Safety-first stain guidance, identification flow and expert mode. Monthly or annual — your choice.
            </DialogDescription>
          </DialogHeader>
          <p className="mt-3 inline-block rounded-md bg-[hsl(140_70%_18%)] px-2.5 py-1 text-[12px] font-extrabold text-[hsl(140_85%_88%)] shadow-sm">
            Founding price — guaranteed for the first 12 months
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3 p-5">
          {/* Plan toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPlanChoice("monthly")}
              className={`rounded-lg border p-3 text-left transition-colors ${
                planChoice === "monthly" ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Monthly</span>
              <span className="mt-1 block text-lg font-extrabold text-navy">
                {formatMoney(monthly.offerPriceMinor, monthly.currency)}
                <span className="text-xs font-medium text-muted-foreground">/mo</span>
              </span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{monthly.taxLabel} included</span>
            </button>
            <button
              type="button"
              onClick={() => setPlanChoice("annual")}
              className={`relative rounded-lg border p-3 text-left transition-colors ${
                planChoice === "annual" ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="absolute -top-2 left-2 rounded-full bg-proceed px-2 py-0.5 text-[9px] font-bold text-proceed-foreground">
                Save {annualDiscount}%
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Annual</span>
              <span className="mt-1 block text-lg font-extrabold text-navy">
                {formatMoney(annual.offerPriceMinor, annual.currency)}
                <span className="text-xs font-medium text-muted-foreground">/yr</span>
              </span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">
                Save {formatMoney(savingsMinor(annual), annual.currency)}
              </span>
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground">
            {accessPeriodLabel(plan)} · {plan.taxLabel} included · no lifetime lock-in
          </p>

          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-1">
            <Label htmlFor="sm-name">Full name</Label>
            <Input
              id="sm-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              maxLength={80}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="sm-email">Email</Label>
            <Input
              id="sm-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              maxLength={255}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="sm-phone">Phone number</Label>
            <Input
              id="sm-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
              maxLength={20}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <Button type="submit" className="h-11 w-full text-base font-bold" disabled={submitting}>
            <Lock className="h-4 w-4" />
            {submitting ? "Activating…" : `Start ${planChoice === "annual" ? "Annual" : "Monthly"} · ${formatMoney(plan.offerPriceMinor, plan.currency)}`}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            Secure checkout · {plan.taxLabel} included · Founding price guaranteed 12 months
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
