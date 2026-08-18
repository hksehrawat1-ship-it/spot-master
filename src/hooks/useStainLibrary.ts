import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const PAGE_SIZE = 25;

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

/** Shown wherever no approved treatment method exists for a record. */
export const NO_APPROVED_METHOD =
  "An approved treatment method is not yet available. Follow the current product label or technical data sheet.";

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
  stable_id: string;
  canonical_name: string;
  primary_category_id: string;
  typical_chemistry: string | null;
  initial_outcome_class: OutcomeClass;
  mandatory_stop_or_reroute_trigger: string | null;
  reroute_pending: boolean;
  hidden_test_required: boolean;
  biological_risk: boolean;
  chemical_risk: boolean;
  fire_risk: boolean;
  damage_suspected: boolean;
  source_section: string | null;
};

/** All 12 categories are imported; nothing is pending. */
export const PENDING_CATEGORIES: { category_number: number; canonical_name: string }[] = [];

const CATEGORY_FIELDS =
  "id, category_number, canonical_name, slug, short_description, core_rule, routing_note, display_order";

const RECORD_FIELDS =
  "id, stable_id, canonical_name, primary_category_id, typical_chemistry, initial_outcome_class, " +
  "mandatory_stop_or_reroute_trigger, reroute_pending, hidden_test_required, " +
  "biological_risk, chemical_risk, fire_risk, damage_suspected, source_section";

/** Only the twelve active, numbered, non-legacy categories are ever exposed publicly. */
function activeCategoryQuery() {
  return supabase
    .from("stain_categories")
    .select(CATEGORY_FIELDS)
    .eq("is_legacy", false)
    .not("category_number", "is", null);
}

/* ------------------------------------------------------------------ categories */

export function useStainCategories() {
  const [categories, setCategories] = useState<StainCategoryRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [catRes, countRes] = await Promise.all([
        activeCategoryQuery().order("display_order", { ascending: true }),
        supabase.rpc("stain_category_counts"),
      ]);
      if (!active) return;
      if (catRes.error) setError(catRes.error.message);
      else if (countRes.error) setError(countRes.error.message);
      setCategories((catRes.data ?? []) as StainCategoryRow[]);
      const map: Record<string, number> = {};
      for (const row of (countRes.data ?? []) as { category_id: string; record_count: number }[]) {
        map[row.category_id] = Number(row.record_count);
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

/* ------------------------------------------------------------------ category records (paginated) */

export function useStainCategoryRecords(slug: string | undefined) {
  const [category, setCategory] = useState<StainCategoryRow | null>(null);
  const [records, setRecords] = useState<StainRecordRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(0);
    setRecords([]);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    page === 0 ? setLoading(true) : setLoadingMore(true);
    (async () => {
      let cat = category;
      if (!cat || cat.slug !== slug) {
        const { data, error: catErr } = await activeCategoryQuery().eq("slug", slug).maybeSingle();
        if (!active) return;
        if (catErr) setError(catErr.message);
        cat = (data as StainCategoryRow) ?? null;
        setCategory(cat);
      }
      if (!cat) {
        setRecords([]);
        setTotal(0);
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      const from = page * PAGE_SIZE;
      const { data, count, error: recErr } = await supabase
        .from("stain_records")
        .select(RECORD_FIELDS, { count: "exact" })
        .eq("primary_category_id", cat.id)
        .eq("publication_status", "published")
        .order("canonical_name", { ascending: true })
        .order("stable_id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (!active) return;
      if (recErr) setError(recErr.message);
      const rows = (data ?? []) as unknown as StainRecordRow[];
      setRecords((prev) => (page === 0 ? rows : [...prev, ...rows]));
      setTotal(count ?? 0);
      setLoading(false);
      setLoadingMore(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, page]);

  const loadMore = useCallback(() => setPage((p) => p + 1), []);
  const hasMore = records.length < total;

  return { category, records, total, loading, loadingMore, error, loadMore, hasMore };
}

/* ------------------------------------------------------------------ search */

export type StainSearchHit = StainRecordRow & {
  categoryName: string;
  categorySlug: string;
  match_rank: number;
};

type SearchRow = {
  id: string;
  stable_id: string;
  canonical_name: string;
  primary_category_id: string;
  category_name: string;
  category_slug: string;
  initial_outcome_class: string;
  typical_chemistry: string | null;
  mandatory_stop_or_reroute_trigger: string | null;
  hidden_test_required: boolean;
  biological_risk: boolean;
  chemical_risk: boolean;
  fire_risk: boolean;
  damage_suspected: boolean;
  reroute_pending: boolean;
  match_rank: number;
  total_count: number;
};

const UNKNOWN_CHEMICAL = /\bunknown\b.*\bchemical\b|\bchemical\b.*\bunknown\b/i;

export function useStainSearch(query: string) {
  const [hits, setHits] = useState<StainSearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const term = query.trim();
  const run = useRef(0);

  useEffect(() => {
    setPage(0);
  }, [term]);

  useEffect(() => {
    if (term.length < 2) {
      setHits([]);
      setTotal(0);
      setError(null);
      setSearching(false);
      return;
    }
    let active = true;
    const id = ++run.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      const { data, error: rpcErr } = await supabase.rpc("search_stains", {
        q: term,
        lim: PAGE_SIZE,
        off: page * PAGE_SIZE,
      });
      // Ignore any response that a newer query has superseded.
      if (!active || id !== run.current) return;
      if (rpcErr) {
        setError(rpcErr.message);
        setHits([]);
        setTotal(0);
        setSearching(false);
        return;
      }
      setError(null);
      const rows = (data ?? []) as SearchRow[];
      const mapped: StainSearchHit[] = rows.map((r) => ({
        id: r.id,
        stable_id: r.stable_id,
        canonical_name: r.canonical_name,
        primary_category_id: r.primary_category_id,
        typical_chemistry: r.typical_chemistry,
        initial_outcome_class: r.initial_outcome_class as OutcomeClass,
        mandatory_stop_or_reroute_trigger: r.mandatory_stop_or_reroute_trigger,
        reroute_pending: r.reroute_pending,
        hidden_test_required: r.hidden_test_required,
        biological_risk: r.biological_risk,
        chemical_risk: r.chemical_risk,
        fire_risk: r.fire_risk,
        damage_suspected: r.damage_suspected,
        source_section: null,
        categoryName: r.category_name,
        categorySlug: r.category_slug,
        match_rank: r.match_rank,
      }));
      setHits((prev) => (page === 0 ? mapped : [...prev, ...mapped]));
      setTotal(rows[0]?.total_count ? Number(rows[0].total_count) : page === 0 ? 0 : total);
      setSearching(false);
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, page]);

  const loadMore = useCallback(() => setPage((p) => p + 1), []);

  return useMemo(
    () => ({
      hits,
      total,
      searching,
      error,
      active: term.length >= 2,
      hasMore: hits.length < total,
      loadMore,
      unknownChemical: UNKNOWN_CHEMICAL.test(term),
    }),
    [hits, total, searching, error, term, loadMore],
  );
}

/* ------------------------------------------------------------------ detail */

export type StainDetailRecord = {
  id: string;
  stable_id: string;
  canonical_name: string;
  primary_category_id: string;
  searchable_secondary_category_ids: string[];
  typical_chemistry: string | null;
  dominant_residue: string | null;
  initial_outcome_class: OutcomeClass;
  mandatory_stop_or_reroute_trigger: string | null;
  physical_state: string | null;
  fresh: boolean;
  dried: boolean;
  aged: boolean;
  heat_set: boolean;
  oxidized: boolean;
  cured: boolean;
  previously_treated: boolean;
  biological_risk: boolean;
  chemical_risk: boolean;
  fire_risk: boolean;
  inhalation_risk: boolean;
  contamination_risk: boolean;
  damage_suspected: boolean;
  deposit_present: boolean;
  hidden_test_required: boolean;
  reroute_target: string | null;
  reroute_pending: boolean;
  publication_status: string;
  review_status: string;
  source_document_id: string | null;
  source_section: string | null;
  category_version: string | null;
};

export type StainDetail = {
  record: StainDetailRecord;
  category: StainCategoryRow | null;
  secondaryCategories: StainCategoryRow[];
  reroutes: { category: StainCategoryRow; routing_note: string | null }[];
  aliases: { alias: string; language: string; region: string | null }[];
  sourceDocument: string | null;
};

export function useStainDetail(key: string | undefined) {
  const [detail, setDetail] = useState<StainDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setDetail(null);
    (async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
      // Stable ID first, then internal id as a fallback.
      let { data: rec, error: recErr } = await supabase
        .from("stain_records")
        .select("*")
        .ilike("stable_id", key)
        .maybeSingle();
      if (!rec && isUuid) {
        const byId = await supabase.from("stain_records").select("*").eq("id", key).maybeSingle();
        rec = byId.data;
        recErr = byId.error;
      }
      if (!active) return;
      if (recErr) setError(recErr.message);
      if (!rec) {
        setDetail(null);
        setLoading(false);
        return;
      }

      const record = rec as unknown as StainDetailRecord;
      const catIds = [record.primary_category_id, ...(record.searchable_secondary_category_ids ?? [])];

      const [catsRes, reroutesRes, aliasRes, docRes] = await Promise.all([
        supabase.from("stain_categories").select(CATEGORY_FIELDS).in("id", catIds),
        supabase
          .from("stain_record_reroutes")
          .select("routing_note, sort_order, target_category_id")
          .eq("stain_record_id", record.id)
          .eq("review_status", "approved")
          .eq("is_suggestion", false)
          .order("sort_order", { ascending: true }),
        supabase
          .from("stain_record_aliases")
          .select("alias, language, region")
          .eq("stain_record_id", record.id)
          .eq("is_active", true)
          .eq("review_status", "approved"),
        record.source_document_id
          ? supabase.from("source_documents").select("title").eq("id", record.source_document_id).maybeSingle()
          : Promise.resolve({ data: null } as { data: { title: string } | null }),
      ]);
      if (!active) return;

      const cats = (catsRes.data ?? []) as StainCategoryRow[];
      const byId = new Map(cats.map((c) => [c.id, c]));
      const rerouteRows = (reroutesRes.data ?? []) as {
        routing_note: string | null;
        sort_order: number;
        target_category_id: string;
      }[];

      let rerouteCats = rerouteRows
        .map((r) => ({ category: byId.get(r.target_category_id), routing_note: r.routing_note }))
        .filter((r): r is { category: StainCategoryRow; routing_note: string | null } => !!r.category);

      const missing = rerouteRows.map((r) => r.target_category_id).filter((id) => !byId.has(id));
      if (missing.length) {
        const { data } = await supabase.from("stain_categories").select(CATEGORY_FIELDS).in("id", missing);
        if (!active) return;
        const extra = new Map(((data ?? []) as StainCategoryRow[]).map((c) => [c.id, c]));
        rerouteCats = rerouteRows
          .map((r) => ({
            category: byId.get(r.target_category_id) ?? extra.get(r.target_category_id),
            routing_note: r.routing_note,
          }))
          .filter((r): r is { category: StainCategoryRow; routing_note: string | null } => !!r.category);
      }

      setDetail({
        record,
        category: byId.get(record.primary_category_id) ?? null,
        secondaryCategories: (record.searchable_secondary_category_ids ?? [])
          .map((id) => byId.get(id))
          .filter((c): c is StainCategoryRow => !!c),
        reroutes: rerouteCats,
        aliases: (aliasRes.data ?? []) as { alias: string; language: string; region: string | null }[],
        sourceDocument: (docRes.data as { title: string } | null)?.title ?? null,
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [key]);

  return { detail, loading, error };
}

/* ------------------------------------------------------------------ helpers */

export function riskFlags(r: Pick<StainRecordRow, "biological_risk" | "chemical_risk" | "fire_risk" | "damage_suspected" | "hidden_test_required">): string[] {
  const out: string[] = [];
  if (r.biological_risk) out.push("Biological handling");
  if (r.chemical_risk) out.push("Chemical risk");
  if (r.fire_risk) out.push("Fire risk");
  if (r.damage_suspected) out.push("Damage possible");
  if (r.hidden_test_required) out.push("Concealed test required");
  return out;
}

export function stateFlags(r: StainDetailRecord): string[] {
  const map: [boolean, string][] = [
    [r.fresh, "Fresh"],
    [r.dried, "Dried"],
    [r.aged, "Aged"],
    [r.heat_set, "Heat-set"],
    [r.oxidized, "Oxidized"],
    [r.cured, "Cured"],
    [r.previously_treated, "Previously treated"],
  ];
  return map.filter(([on]) => on).map(([, label]) => label);
}

/** Never render raw free text as if it were a category. */
export function rerouteLabel(r: Pick<StainRecordRow, "reroute_pending" | "initial_outcome_class">): string | null {
  if (r.reroute_pending) return "Reroute under review";
  if (r.initial_outcome_class === "reroute_required") return "Reroute required";
  return null;
}
