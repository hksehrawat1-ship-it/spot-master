#!/usr/bin/env python3
"""Stain Master — Import Batch 2 (Categories 11 and 12).

Idempotent: re-running upserts on stable_id / slug / batch_number and never
creates duplicates. Reads the two approved category documents (extracted text)
and emits SQL executed through psql.

Usage:  python3 scripts/import_stain_batch2.py <cat11.txt> <cat12.txt> > batch2.sql
"""
import re
import sys

OUTCOME = {
    "often reducible": "often_reducible",
    "variable": "variable",
    "reroute required": "reroute_required",
    "high risk": "high_risk",
    "damage/permanent": "damage_permanent",
    "blocked initially": "blocked_initially",
}

CATEGORIES = {
    11: dict(
        canonical_name="Metal / Rust / Mineral Stains",
        slug="metal-rust-mineral-stains",
        short_description=(
            "Metal, corrosion, mineral and salt deposits, including combinations with oil, "
            "pigment or particulate soil."
        ),
        doc_ref="SM-DOC-CAT-11",
        doc_title="Category 11 - Reducible (Metal / Rust) Stains",
    ),
    12: dict(
        canonical_name="Chemical Stains / Fabric Damage",
        slug="chemical-stains-fabric-damage",
        short_description=(
            "Chemical, heat, mechanical and environmental changes to the textile itself, "
            "distinguished from removable deposited residue."
        ),
        doc_ref="SM-DOC-CAT-12",
        doc_title="Category 12 - Chemical Stains / Fabric Damage",
    ),
}

HEADER_ROW = "Stain record | Typical chemistry | Initial outlook | Mandatory stop/reroute trigger"


def q(v):
    if v is None or v == "":
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def arr(values):
    if not values:
        return "'{}'::text[]"
    return "ARRAY[" + ",".join(q(v) for v in values) + "]::text[]"


def slugify(name):
    s = re.sub(r"[^A-Za-z0-9]+", "-", name).strip("-").upper()
    return re.sub(r"-+", "-", s)


def parse(path, number):
    lines = [l.rstrip("\n") for l in open(path, encoding="utf-8")]
    core_rule = None
    routing_note = None
    version = "1.0"
    stop_rules = []
    customer_wording = None
    records = []
    section = None
    in_stop_block = False

    for line in lines:
        t = line.strip()
        if not t:
            continue
        if t.startswith("Core rule"):
            core_rule = t.split("Core rule", 1)[1].strip(" \u00a0")
            continue
        m = re.search(r"Version\s+([0-9.]+)", t)
        if m and version == "1.0":
            version = m.group(1)
        if t.startswith("3. Responsible stop-and-return rule"):
            in_stop_block = True
            continue
        if in_stop_block:
            if t.startswith("Customer wording"):
                customer_wording = t.split("Customer wording", 1)[1].strip(" \u00a0")
                in_stop_block = False
                continue
            if t.startswith("Stop further spotting"):
                continue
            if t.startswith("4."):
                in_stop_block = False
            else:
                stop_rules.append(t)
                continue
        if t.startswith("Deposited detergent") or t.startswith("Mineral deposits"):
            routing_note = t
            continue
        if t == HEADER_ROW:
            continue
        if "|" in t:
            cells = [c.strip() for c in t.split("|")]
            if len(cells) == 4 and cells[2].lower() in OUTCOME:
                records.append(
                    dict(
                        name=cells[0],
                        chemistry=cells[1],
                        outcome=OUTCOME[cells[2].lower()],
                        trigger=cells[3],
                        section=section,
                    )
                )
            continue
        # plain paragraph inside the catalogue = section heading
        if records or t not in ("", None):
            if not t[0].isdigit() and len(t) < 70 and not t.endswith("."):
                section = t
    return dict(
        number=number,
        core_rule=core_rule,
        routing_note=routing_note,
        version=version,
        stop_rules=stop_rules,
        customer_wording=customer_wording,
        records=records,
    )


BIO = ("mould", "mildew", "microb", "blood", "biological", "rodent", "insect", "pest", "flood", "hygiene")
CHEM = ("acid", "alkali", "bleach", "oxidiz", "oxidis", "chlorine", "peroxide", "ammonia", "solvent",
        "chemical", "corrosi", "battery", "pesticide", "disinfect", "reagent", "caustic", "persulfate",
        "sds", "hazardous", "salts", "electrolyte", "reducing", "redox", "sanitizer", "polymer")
FIRE = ("acetone", "thinner", "alcohol", "sanitizer", "nail-polish remover", "adhesive-remover",
        "solvent", "welding", "grinding")
INHAL = ("sds", "ventilation", "dust", "powder", "volatile", "odorous", "grinding", "welding", "spray")
CONTAM = ("contaminat", "industrial", "flood", "biohazard", "rodent", "hazardous", "pool", "sewage",
          "remediation", "isolate")
DAMAGE = ("damage", "weaken", "loss", "hole", "melt", "felt", "shrink", "delamin", "degrad", "burn",
          "scorch", "fade", "fading", "peel", "crack", "distort", "failure", "brittle", "glaz")


def flag(rec, words):
    hay = (rec["name"] + " " + rec["chemistry"] + " " + rec["trigger"]).lower()
    return any(w in hay for w in words)


def reroute_of(rec):
    m = re.search(r"Route to the Category ([0-9/ ,and]+)", rec["trigger"])
    if not m:
        return None
    nums = re.findall(r"\d+", m.group(1))
    return ",".join("Category " + n for n in dict.fromkeys(nums))


def emit(cat, cat11, cat12):
    out = []
    meta = CATEGORIES[cat["number"]]
    n = cat["number"]
    doc_var = f"doc{n}"
    out.append(f"""
-- ===== Category {n} =====
WITH d AS (
  INSERT INTO source_documents (document_ref, document_title, document_type, version, language,
                                verification_status, document_state, notes)
  VALUES ({q(meta['doc_ref'])}, {q(meta['doc_title'])}, 'credible_reference', {q(cat['version'])}, 'en',
          'pending_review', 'uploaded', 'Approved Stain Master category document, Import Batch 2.')
  ON CONFLICT (document_ref) DO UPDATE SET document_title = EXCLUDED.document_title,
    version = EXCLUDED.version, updated_at = now()
  RETURNING id
)
SELECT 1;""")
    out.append(f"""
INSERT INTO stain_categories (category_key, name, description, sort_order, status, category_number,
  canonical_name, slug, short_description, core_rule, routing_note, display_order, version,
  active_status, source_document_id)
VALUES ({q(meta['slug'])}, {q(meta['canonical_name'])}, {q(meta['short_description'])}, {n}, 'published', {n},
  {q(meta['canonical_name'])}, {q(meta['slug'])}, {q(meta['short_description'])}, {q(cat['core_rule'])},
  {q(cat['routing_note'])}, {n}, {q(cat['version'])}, true,
  (SELECT id FROM source_documents WHERE document_ref = {q(meta['doc_ref'])}))
ON CONFLICT (category_key) DO UPDATE SET
  category_number = EXCLUDED.category_number, canonical_name = EXCLUDED.canonical_name,
  slug = EXCLUDED.slug, short_description = EXCLUDED.short_description, core_rule = EXCLUDED.core_rule,
  routing_note = EXCLUDED.routing_note, display_order = EXCLUDED.display_order,
  version = EXCLUDED.version, active_status = true, source_document_id = EXCLUDED.source_document_id,
  updated_at = now();""")

    # stop/return rules (idempotent: replace this category's rules)
    out.append(f"""
DELETE FROM stop_return_rules WHERE category_id = (SELECT id FROM stain_categories WHERE slug = {q(meta['slug'])});""")
    rule_vals = ",".join(
        f"({i},{q(r)})" for i, r in enumerate(cat["stop_rules"], start=1)
    )
    if rule_vals:
        out.append(f"""
INSERT INTO stop_return_rules (category_id, rule_order, rule_text, rule_type, customer_wording,
  source_document_id, import_batch_id)
SELECT (SELECT id FROM stain_categories WHERE slug = {q(meta['slug'])}), v.o, v.t, 'stop_and_return',
  {q(cat['customer_wording'])}, (SELECT id FROM source_documents WHERE document_ref = {q(meta['doc_ref'])}),
  (SELECT id FROM import_batches WHERE batch_number = 2)
FROM (VALUES {rule_vals}) AS v(o,t);""")

    rows = []
    alias_rows = []
    reroute_nums = set()
    for rec in cat["records"]:
        stable = f"SM-CAT-{n:02d}-{slugify(rec['name'])}"
        reroute = reroute_of(rec)
        if reroute:
            reroute_nums.update(re.findall(r"\d+", reroute))
        name = rec["name"]
        aliases = []
        if "/" in name:
            parts = [p.strip() for p in name.split("/") if p.strip()]
            head_words = parts[0].split()
            aliases = [parts[0]]
            for p in parts[1:]:
                aliases.append(" ".join(head_words[:-1] + [p]) if len(p.split()) == 1 and len(head_words) > 1 else p)
            aliases = [a for a in dict.fromkeys(aliases) if a.lower() != name.lower()]
        damage = rec["outcome"] == "damage_permanent" or flag(rec, DAMAGE)
        deposit = rec["outcome"] != "damage_permanent"
        hidden = ("controlled testing" in rec["trigger"].lower()
                  or "verify source and textile stability" in rec["trigger"].lower())
        low = name.lower()
        b = lambda x: "true" if x else "false"
        rows.append(
            f"({q(stable)},{q(name)},{q(rec['chemistry'])},{q(rec['outcome'])},{q(rec['trigger'])},"
            f"{arr(aliases)},{b(flag(rec, BIO))},{b(flag(rec, CHEM))},{b(flag(rec, FIRE))},"
            f"{b(flag(rec, INHAL))},{b(flag(rec, CONTAM))},{b(damage)},{b(deposit)},{b(hidden)},"
            f"{b('aged' in low or 'old' in low)},{b('oxid' in low or 'oxid' in rec['chemistry'].lower())},"
            f"{b('heat' in low or 'scorch' in low or 'melt' in low or 'press' in low)},"
            f"{b('previous' in low or 'after' in low or 'residual' in low)},{q(reroute)},{q(rec['section'])})"
        )
        for a in aliases:
            alias_rows.append(f"({q(stable)},{q(a)})")

    out.append(f"""
INSERT INTO stain_records (stable_id, canonical_name, primary_category_id, typical_chemistry,
  initial_outcome_class, mandatory_stop_or_reroute_trigger, aliases, biological_risk, chemical_risk,
  fire_risk, inhalation_risk, contamination_risk, damage_suspected, deposit_present,
  hidden_test_required, aged, oxidized, heat_set, previously_treated, reroute_target, reroute_pending,
  publication_status, review_status, source_document_id, source_section, category_version, import_batch_id)
SELECT v.stable_id, v.canonical_name, (SELECT id FROM stain_categories WHERE slug = {q(meta['slug'])}),
  v.chem, v.outcome, v.trigger, v.aliases, v.bio, v.chemr, v.fire, v.inhal, v.contam, v.damage,
  v.deposit, v.hidden, v.aged, v.oxidized, v.heat_set, v.prev, v.reroute, false, 'published', 'approved',
  (SELECT id FROM source_documents WHERE document_ref = {q(meta['doc_ref'])}), v.section, {q(cat['version'])},
  (SELECT id FROM import_batches WHERE batch_number = 2)
FROM (VALUES
{",".join(rows)}
) AS v(stable_id, canonical_name, chem, outcome, trigger, aliases, bio, chemr, fire, inhal, contam,
       damage, deposit, hidden, aged, oxidized, heat_set, prev, reroute, section)
ON CONFLICT (stable_id) DO UPDATE SET
  canonical_name = EXCLUDED.canonical_name, primary_category_id = EXCLUDED.primary_category_id,
  typical_chemistry = EXCLUDED.typical_chemistry, initial_outcome_class = EXCLUDED.initial_outcome_class,
  mandatory_stop_or_reroute_trigger = EXCLUDED.mandatory_stop_or_reroute_trigger,
  aliases = EXCLUDED.aliases, biological_risk = EXCLUDED.biological_risk,
  chemical_risk = EXCLUDED.chemical_risk, fire_risk = EXCLUDED.fire_risk,
  inhalation_risk = EXCLUDED.inhalation_risk, contamination_risk = EXCLUDED.contamination_risk,
  damage_suspected = EXCLUDED.damage_suspected, deposit_present = EXCLUDED.deposit_present,
  hidden_test_required = EXCLUDED.hidden_test_required, reroute_target = EXCLUDED.reroute_target,
  reroute_pending = false, source_document_id = EXCLUDED.source_document_id,
  source_section = EXCLUDED.source_section, category_version = EXCLUDED.category_version,
  import_batch_id = EXCLUDED.import_batch_id, updated_at = now();""")

    if alias_rows:
        out.append(f"""
INSERT INTO stain_record_aliases (stain_record_id, alias, alias_type, language, source_document_id)
SELECT r.id, v.alias, 'alternative_name', 'en',
  (SELECT id FROM source_documents WHERE document_ref = {q(meta['doc_ref'])})
FROM (VALUES
{",".join(alias_rows)}
) AS v(stable_id, alias)
JOIN stain_records r ON r.stable_id = v.stable_id
ON CONFLICT (stain_record_id, alias, language) DO NOTHING;""")

    for num in sorted(reroute_nums, key=int):
        out.append(f"""
INSERT INTO category_relationships (from_category_id, to_category_number, to_category_id, relationship_type, status, note)
SELECT (SELECT id FROM stain_categories WHERE slug = {q(meta['slug'])}), {num},
  (SELECT id FROM stain_categories WHERE category_number = {num}), 'reroute', 'active',
  'Derived from approved category document routing guidance.'
WHERE NOT EXISTS (
  SELECT 1 FROM category_relationships c
  WHERE c.from_category_id = (SELECT id FROM stain_categories WHERE slug = {q(meta['slug'])})
    AND c.to_category_number = {num} AND c.relationship_type = 'reroute');""")
    return "\n".join(out)


        if reroute:
            for num in re.findall(r"\d+", reroute):
                out.append(f"""
INSERT INTO category_relationships (from_category_id, to_category_number, to_category_id, relationship_type, status, note)
SELECT (SELECT id FROM stain_categories WHERE slug = {q(meta['slug'])}), {num},
  (SELECT id FROM stain_categories WHERE category_number = {num}), 'reroute', 'active',
  'Derived from approved category document routing guidance.'
WHERE NOT EXISTS (
  SELECT 1 FROM category_relationships c
  WHERE c.from_category_id = (SELECT id FROM stain_categories WHERE slug = {q(meta['slug'])})
    AND c.to_category_number = {num} AND c.relationship_type = 'reroute');""")
    return "\n".join(out)


def main():
    p11, p12 = sys.argv[1], sys.argv[2]
    cat11 = parse(p11, 11)
    cat12 = parse(p12, 12)
    assert len(cat11["records"]) == 56, len(cat11["records"])
    assert len(cat12["records"]) == 78, len(cat12["records"])

    sql = ["BEGIN;"]
    sql.append("""
INSERT INTO import_batches (batch_name, batch_number, expected_document_count, expected_category_numbers,
  status, validation_status)
VALUES ('Stain Master Categories 11-12', 2, 2, ARRAY[11,12], 'processing', 'pending')
ON CONFLICT (batch_number) DO UPDATE SET status = 'processing', validation_status = 'pending',
  started_at = now(), completed_at = NULL, updated_at = now();""")
    sql.append(emit(cat11, cat11, cat12))
    sql.append(emit(cat12, cat11, cat12))

    # ---- cross-category reconciliation of pending routes from Categories 1-10 ----
    sql.append("""
UPDATE stain_records r
SET reroute_target = replace(r.reroute_target, 'pending_category_import:', ''),
    reroute_pending = false,
    searchable_secondary_category_ids = (
      SELECT COALESCE(array_agg(DISTINCT c.id), '{}'::uuid[])
      FROM stain_categories c
      WHERE c.category_number IS NOT NULL
        AND r.reroute_target LIKE '%Category ' || c.category_number::text || '%'
    ) || r.searchable_secondary_category_ids,
    updated_at = now()
WHERE r.reroute_pending
  AND NOT EXISTS (
    SELECT 1 FROM regexp_matches(r.reroute_target, 'Category ([0-9]+)', 'g') m
    WHERE NOT EXISTS (SELECT 1 FROM stain_categories c
                      WHERE c.category_number = m[1]::int AND c.active_status)
  );

UPDATE stain_records
SET searchable_secondary_category_ids = (
  SELECT COALESCE(array_agg(DISTINCT x), '{}'::uuid[])
  FROM unnest(searchable_secondary_category_ids) x
  WHERE x <> primary_category_id
)
WHERE cardinality(searchable_secondary_category_ids) > 0;

UPDATE import_batches SET
  total_records_imported = (SELECT count(*) FROM stain_records r
    JOIN stain_categories c ON c.id = r.primary_category_id WHERE c.category_number IN (11,12)),
  total_records_updated = (SELECT count(*) FROM stain_records WHERE reroute_pending = false
    AND reroute_target LIKE 'Category%' AND import_batch_id <> (SELECT id FROM import_batches WHERE batch_number = 2)),
  total_duplicates_prevented = 0,
  total_records_requiring_review = (SELECT count(*) FROM stain_records r
    JOIN stain_categories c ON c.id = r.primary_category_id
    WHERE c.category_number IN (11,12) AND r.review_status <> 'approved'),
  updated_at = now()
WHERE batch_number = 2;
COMMIT;""")
    print("\n".join(sql))


if __name__ == "__main__":
    main()
