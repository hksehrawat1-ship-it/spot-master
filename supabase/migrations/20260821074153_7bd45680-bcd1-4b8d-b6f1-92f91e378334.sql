alter table public.pricing_plans
  add column if not exists tax_inclusive boolean not null default false;

update public.pricing_plans
set plan_name = 'Stain Master — Annual (Founding)',
    list_price_minor = 838800,
    offer_price_minor = 699900,
    currency = 'INR',
    access_period_days = 365,
    tax_rate_percent = 18.00,
    tax_label = 'GST',
    tax_inclusive = true,
    is_active = true,
    updated_at = now()
where plan_code = 'professional_access';

insert into public.pricing_plans
  (plan_code, plan_name, list_price_minor, offer_price_minor, currency,
   access_period_days, tax_rate_percent, tax_label, tax_inclusive, is_active)
values
  ('professional_access_monthly', 'Stain Master — Monthly',
   69900, 69900, 'INR', 30, 18.00, 'GST', true, true),
  ('professional_access_annual_usd', 'Stain Master — Annual (International)',
   8988, 7499, 'USD', 365, 0.00, 'Local taxes', true, true)
on conflict (plan_code) do update set
   plan_name = excluded.plan_name,
   list_price_minor = excluded.list_price_minor,
   offer_price_minor = excluded.offer_price_minor,
   currency = excluded.currency,
   access_period_days = excluded.access_period_days,
   tax_rate_percent = excluded.tax_rate_percent,
   tax_label = excluded.tax_label,
   tax_inclusive = excluded.tax_inclusive,
   is_active = excluded.is_active,
   updated_at = now();