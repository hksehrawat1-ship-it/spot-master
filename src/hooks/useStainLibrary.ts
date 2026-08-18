import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type OutcomeClass =
  | "often_reducible"
  | "variable"
  | "reroute_required"
  | "high_risk"
  | "damage_permanent"
  | "blocked_initially";

export const OUTCOME_LABEL: Record<OutcomeClass, string> = {
  often_reducible: "Often reducible",
  variable: "Variable",
  reroute_required: "Reroute required",
  high_risk: "High risk",
  damage_permanent: "Often permanent / possible damage",
  blocked_initially: "Blocked initially",
};

export const OUTCOME_TONE: Record<OutcomeClass, "muted" | "warn" | "risk"> = {
  often_reducible: "muted",
  variable: "muted",
  reroute_required: "warn",
  high_risk: "risk",
  damage_permanent: "risk",
  blocked_initially: "risk",
};

export type StainCategoryRow = {
  id: string;
  category_number: number;
  canonical_name: string;
  slug: string;
  short_description: string | null;
  core_rule: string | null;
  routing_note: string | null;
  display_order: number | null;
};

export type StainRecordRow = {
  id: string;
  canonical_name: string;
  primary_category_id: string;
  typical_chemistry: string | null;
  initial_outcome_class: OutcomeClass;
  mandatory_stop_or_reroute_trigger: string | null;
  reroute_target: string | null;
  reroute_pending: boolean;
  hidden_test_required: boolean;
  biological_risk: boolean;
  chemical_risk: boolean;
  fire_risk: boolean;
  damage_suspected: boolean;
  source_section: string | null;
};

/** Categories 11 and 12 are not imported yet (Import Batch 2). */
export const PENDING_CATEGORIES = [
  { category_number: 11, canonical_name: "Metal / Rust / Mineral Stains" },
  { category_number: 12, canonical_name: "Chemical Stains / Fabric Damage" },
];

const RECORD_FIELDS =
  "id, canonical_name, primary_category_id, typical_chemistry, initial_outcome_class, " +
  "mandatory_stop_or_reroute_trigger, reroute_target, reroute_pending, hidden_test_required, " +
  "biological_risk, chemical_risk, fire_risk, damage_suspected, source_section";

export function useStainCategories() {
  const [categories, setCategories] = useState<StainCategoryRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [catRes, recRes] = await Promise.all([
        supabase
          .from("stain_categories")
          .select("id, category_number, canonical_name, slug, short_description, core_rule, routing_note, display_order")
          .not("category_number", "is", null)
          .order("display_order", { ascending: true }),
        supabase.from("stain_records").select("primary_category_id").eq("publication_status", "published"),
      ]);
      if (!active) return;
      if (catRes.error) setError(catRes.error.message);
      setCategories((catRes.data ?? []) as StainCategoryRow[]);
      const map: Record<string, number> = {};
      for (const r of (recRes.data ?? []) as { primary_category_id: string }[]) {
        map[r.primary_category_id] = (map[r.primary_category_id] ?? 0) + 1;
      }
      setCounts(map);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { categories, counts, loading, error };
}

export function useStainCategoryRecords(slug: string | undefined) {
  const [category, setCategory] = useState<StainCategoryRow | null>(null);
  const [records, setRecords] = useState<StainRecordRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    (async () => {
      const { data: cat } = await supabase
        .from("stain_categories")
        .select("id, category_number, canonical_name, slug, short_description, core_rule, routing_note, display_order")
        .eq("slug", slug)
        .maybeSingle();
      if (!active) return;
      setCategory((cat as StainCategoryRow) ?? null);
      if (cat) {
        const { data } = await supabase
          .from("stain_records")
          .select(RECORD_FIELDS)
          .eq("primary_category_id", (cat as StainCategoryRow).id)
          .eq("publication_status", "published")
          .order("canonical_name");
        if (!active) return;
        setRecords((data ?? []) as StainRecordRow[]);
      } else {
        setRecords([]);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  return { category, records, loading };
}

export type StainSearchHit = StainRecordRow & { categoryName: string };

export function useStainSearch(query: string) {
  const [hits, setHits] = useState<StainSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const term = query.trim();

  useEffect(() => {
    if (term.length < 2) {
      setHits([]);
      return;
    }
    let active = true;
    setSearching(true);
    const timer = setTimeout(async () => {
      const like = `%${term.replace(/[%_]/g, "")}%`;
      const [byName, byAlias, cats] = await Promise.all([
        supabase
          .from("stain_records")
          .select(RECORD_FIELDS)
          .eq("publication_status", "published")
          .ilike("canonical_name", like)
          .limit(40),
        supabase.from("stain_record_aliases").select("stain_record_id").ilike("alias", like).limit(40),
        supabase.from("stain_categories").select("id, canonical_name").not("category_number", "is", null),
      ]);
      if (!active) return;
      const catName: Record<string, string> = {};
      for (const c of (cats.data ?? []) as { id: string; canonical_name: string }[]) catName[c.id] = c.canonical_name;

      let rows = (byName.data ?? []) as StainRecordRow[];
      const aliasIds = ((byAlias.data ?? []) as { stain_record_id: string }[]).map((a) => a.stain_record_id);
      const missing = aliasIds.filter((id) => !rows.some((r) => r.id === id));
      if (missing.length) {
        const { data } = await supabase
          .from("stain_records")
          .select(RECORD_FIELDS)
          .in("id", missing)
          .eq("publication_status", "published");
        if (!active) return;
        rows = rows.concat((data ?? []) as StainRecordRow[]);
      }
      setHits(
        rows
          .map((r) => ({ ...r, categoryName: catName[r.primary_category_id] ?? "" }))
          .sort((a, b) => a.canonical_name.localeCompare(b.canonical_name)),
      );
      setSearching(false);
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term]);

  return useMemo(() => ({ hits, searching, active: term.length >= 2 }), [hits, searching, term]);
}

export function riskFlags(r: StainRecordRow): string[] {
  const out: string[] = [];
  if (r.biological_risk) out.push("Biological handling");
  if (r.chemical_risk) out.push("Chemical risk");
  if (r.fire_risk) out.push("Fire risk");
  if (r.damage_suspected) out.push("Damage possible");
  if (r.hidden_test_required) out.push("Concealed test required");
  return out;
}

export function rerouteLabel(r: StainRecordRow): string | null {
  if (!r.reroute_target) return null;
  if (r.reroute_pending || r.reroute_target.startsWith("pending_category_import"))
    return "Additional category data pending";
  return `Reroute: ${r.reroute_target}`;
}
