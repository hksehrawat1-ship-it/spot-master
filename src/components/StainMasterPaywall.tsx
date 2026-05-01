import { useState } from "react";
import { z } from "zod";
import { Sparkles, Check, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/useApp";
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

export default function StainMasterPaywall({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const unlock = useApp((s) => s.unlockStainMaster);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitting, setSubmitting] = useState(false);

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
    // Demo: simulate payment
    await new Promise((r) => setTimeout(r, 700));
    unlock({ name: parsed.data.name!, email: parsed.data.email!, phone: parsed.data.phone! });
    setSubmitting(false);
    toast({ title: "Welcome, Stain Master! 🎉", description: "Lifetime access unlocked." });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm overflow-hidden p-0">
        <div className="bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider opacity-90">
            <Sparkles className="h-4 w-4" /> Stain Master · Lifetime
          </div>
          <DialogHeader className="space-y-1 p-0 text-left">
            <DialogTitle className="text-2xl font-bold leading-tight text-primary-foreground">
              Become a Stain Master
            </DialogTitle>
            <DialogDescription className="text-sm text-primary-foreground/90">
              Unlock 500+ pro stain treatments, identification flow & expert mode — for life.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-extrabold">₹9,999</span>
            <span className="pb-1 text-xs opacity-80">one-time · lifetime</span>
          </div>
          <p className="mt-2 inline-block rounded-md bg-[hsl(140_70%_18%)] px-2.5 py-1 text-[12px] font-extrabold text-[hsl(140_85%_88%)] shadow-sm">
            If you buy the Laundry Mastery Bundle it's free for lifetime
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3 p-5">
          <ul className="space-y-1.5 text-xs text-muted-foreground">
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
            {submitting ? "Unlocking…" : "Pay ₹9,999 & Unlock"}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            Secure checkout · Lifetime access · Instant unlock
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
