/**
 * STEP 18 — Scale Stain Master Sustainably.
 * Operating rules, expansion gates, intake schemas and growth waves.
 * Principle: scale the verified system — not the volume of unreviewed content.
 */

export const SCALING_PRINCIPLE =
  "Scale the verified system—not the volume of unreviewed content.";

/* ------------------------------------------------------------------ */
/* 2. Expansion gates                                                  */
/* ------------------------------------------------------------------ */

export const GATE_CHECKS = [
  "owner",
  "evidence",
  "reviewer_availability",
  "country_applicability",
  "translation_capacity",
  "technical_completeness",
  "safety_completeness",
  "testing_requirements",
  "governance_status",
  "operational_support",
  "monitoring_plan",
  "rollback_plan",
] as const;
export type GateCheck = (typeof GATE_CHECKS)[number];

export const GATE_CHECK_LABEL: Record<GateCheck, string> = {
  owner: "Named owner",
  evidence: "Evidence recorded",
  reviewer_availability: "Reviewer available",
  country_applicability: "Country applicability defined",
  translation_capacity: "Translation capacity available",
  technical_completeness: "Technically complete",
  safety_completeness: "Safety complete",
  testing_requirements: "Testing completed",
  governance_status: "Governance status valid",
  operational_support: "Operational support in place",
  monitoring_plan: "Monitoring plan defined",
  rollback_plan: "Rollback plan defined",
};

export const EXPANSION_SUBJECTS = [
  "new_stain",
  "new_company",
  "new_kit",
  "new_product",
  "new_product_formulation",
  "new_domestic_treatment",
  "new_professional_mapping",
  "new_country",
  "new_language",
  "new_safety_rule",
  "new_training_module",
  "new_integration",
] as const;
export type ExpansionSubject = (typeof EXPANSION_SUBJECTS)[number];

export const EXPANSION_SUBJECT_LABEL: Record<ExpansionSubject, string> = {
  new_stain: "New stain",
  new_company: "New company",
  new_kit: "New kit",
  new_product: "New product",
  new_product_formulation: "New product formulation",
  new_domestic_treatment: "New domestic treatment",
  new_professional_mapping: "New professional mapping",
  new_country: "New country",
  new_language: "New language",
  new_safety_rule: "New safety rule",
  new_training_module: "New training module",
  new_integration: "New integration",
};

/** Checks that can never be waived, whatever the subject. */
export const NON_WAIVABLE_CHECKS: GateCheck[] = [
  "evidence",
  "safety_completeness",
  "governance_status",
];

export type GateSubmission = {
  subject: ExpansionSubject;
  reference: string;
  checks: Partial<Record<GateCheck, boolean>>;
  requestedWaivers?: GateCheck[];
};

/* ------------------------------------------------------------------ */
/* 3. New stain intake                                                 */
/* ------------------------------------------------------------------ */

export const STAIN_INTAKE_FIELDS = [
  "requestedName",
  "alternativeNames",
  "source",
  "countryRelevance",
  "demand",
  "photographs",
  "likelyCategory",
  "possibleComponents",
  "similarExistingStains",
  "requestedUserGroup",
  "evidenceAvailable",
  "requester",
  "priority",
  "safetyConcern",
  "productMappingNeed",
] as const;
export type StainIntakeField = (typeof STAIN_INTAKE_FIELDS)[number];

export const INTAKE_DECISIONS = [
  "add_canonical_stain",
  "add_variant",
  "add_alias",
  "add_source_term",
  "link_existing",
  "add_diagnostic_record",
  "request_more_information",
  "reject_duplicate",
  "defer",
] as const;
export type IntakeDecision = (typeof INTAKE_DECISIONS)[number];

export const INTAKE_DECISION_LABEL: Record<IntakeDecision, string> = {
  add_canonical_stain: "Add new canonical stain",
  add_variant: "Add variant",
  add_alias: "Add alias",
  add_source_term: "Add source term",
  link_existing: "Link to existing stain",
  add_diagnostic_record: "Add diagnostic record",
  request_more_information: "Request more information",
  reject_duplicate: "Reject duplicate",
  defer: "Defer",
};

export type StainIntakeRequest = {
  id: string;
  requestedName: string;
  alternativeNames: string[];
  source: string;
  countryRelevance: string[];
  demand: number;
  photographs: number;
  likelyCategory: string | null;
  possibleComponents: string[];
  similarExistingStains: string[];
  requestedUserGroup: "domestic" | "professional" | "both";
  evidenceAvailable: "none" | "user_reported" | "credible_reference" | "manufacturer" | "internal_trial";
  requester: string;
  priority: ServicePriority;
  safetyConcern: boolean;
  productMappingNeed: boolean;
  duplicateOf?: string;
  reviewerAvailable: boolean;
  decision?: IntakeDecision;
};

export const STAIN_INTAKE_QUEUE: StainIntakeRequest[] = [
  {
    id: "INT-0001", requestedName: "Paan / betel stain", alternativeNames: ["paan", "supari mark"],
    source: "Chewed betel leaf preparation", countryRelevance: ["IN"], demand: 148, photographs: 6,
    likelyCategory: "dye_tannin", possibleComponents: ["tannin", "plant dye", "lime paste"],
    similarExistingStains: ["Tea", "Turmeric/haldi"], requestedUserGroup: "both",
    evidenceAvailable: "credible_reference", requester: "field_trainer_north",
    priority: "high", safetyConcern: false, productMappingNeed: true, reviewerAvailable: true,
  },
  {
    id: "INT-0002", requestedName: "Coconut hair oil", alternativeNames: ["nariyal tel"],
    source: "Hair oil transfer at collar", countryRelevance: ["IN"], demand: 96, photographs: 4,
    likelyCategory: "oil_grease", possibleComponents: ["triglyceride oil", "perfume"],
    similarExistingStains: ["Cooking oil"], requestedUserGroup: "both",
    evidenceAvailable: "internal_trial", requester: "pilot_dry_cleaner_02",
    priority: "high", safetyConcern: false, productMappingNeed: true, reviewerAvailable: true,
  },
  {
    id: "INT-0003", requestedName: "Chai", alternativeNames: ["masala chai"], source: "Tea with milk",
    countryRelevance: ["IN"], demand: 210, photographs: 2, likelyCategory: "combination",
    possibleComponents: ["tannin", "milk protein", "sugar"], similarExistingStains: ["Tea"],
    requestedUserGroup: "both", evidenceAvailable: "user_reported", requester: "search_no_result_job",
    priority: "normal", safetyConcern: false, productMappingNeed: false,
    duplicateOf: "SM-PIL-0001", reviewerAvailable: true,
  },
  {
    id: "INT-0004", requestedName: "Drain cleaner splash", alternativeNames: [],
    source: "Household caustic cleaner", countryRelevance: ["IN"], demand: 12, photographs: 1,
    likelyCategory: null, possibleComponents: ["sodium hydroxide"], similarExistingStains: [],
    requestedUserGroup: "professional", evidenceAvailable: "none", requester: "support_ticket_881",
    priority: "critical", safetyConcern: true, productMappingNeed: false, reviewerAvailable: true,
  },
  {
    id: "INT-0005", requestedName: "Holi colour powder", alternativeNames: ["gulal", "rang"],
    source: "Festival colour", countryRelevance: ["IN"], demand: 175, photographs: 9,
    likelyCategory: "pigment_paint", possibleComponents: ["synthetic dye", "mineral filler", "unknown binder"],
    similarExistingStains: ["Dye transfer"], requestedUserGroup: "both",
    evidenceAvailable: "user_reported", requester: "regional_manager_west",
    priority: "medium", safetyConcern: true, productMappingNeed: true, reviewerAvailable: false,
  },
  {
    id: "INT-0006", requestedName: "Kumkum", alternativeNames: ["roli"], source: "Ceremonial powder",
    countryRelevance: ["IN"], demand: 64, photographs: 3, likelyCategory: "pigment_paint",
    possibleComponents: ["turmeric derivative", "mineral pigment", "oil binder"],
    similarExistingStains: ["Sindoor"], requestedUserGroup: "professional",
    evidenceAvailable: "credible_reference", requester: "pilot_spotter_04",
    priority: "medium", safetyConcern: false, productMappingNeed: true, reviewerAvailable: true,
  },
];

/* ------------------------------------------------------------------ */
/* 4. Prioritisation weights                                           */
/* ------------------------------------------------------------------ */

export const PRIORITY_FACTORS = [
  "search_demand", "no_result_searches", "unknown_stain_frequency", "professional_requests",
  "domestic_requests", "regional_relevance", "safety_importance", "credible_evidence",
  "reviewer_availability", "verified_product_mappings", "training_value",
] as const;
export type PriorityFactor = (typeof PRIORITY_FACTORS)[number];

/* ------------------------------------------------------------------ */
/* 5. Company intake                                                   */
/* ------------------------------------------------------------------ */

export const COMPANY_INTAKE_FIELDS = [
  "legalName", "brandName", "manufacturer", "distributor", "country", "website", "contact",
  "relationships", "catalogue", "kitInformation", "labels", "sds", "tds",
  "manufacturerInstructions", "countryAvailability", "trainingRequirements", "packInformation",
  "priceInformation", "reviewerContact", "verificationStatus",
] as const;
export type CompanyIntakeField = (typeof COMPANY_INTAKE_FIELDS)[number];

/** Fields that must be complete before a company's products become actionable. */
export const COMPANY_ACTIONABLE_REQUIREMENTS: CompanyIntakeField[] = [
  "legalName", "country", "labels", "sds", "tds", "manufacturerInstructions",
  "countryAvailability", "reviewerContact", "verificationStatus",
];

export type CompanyIntake = {
  id: string;
  legalName: string;
  brandName: string;
  fields: Partial<Record<CompanyIntakeField, boolean>>;
  verification: "unverified" | "pending_review" | "verified" | "insufficient_information";
};

export const COMPANY_INTAKE_QUEUE: CompanyIntake[] = [
  {
    id: "CO-004", legalName: "Kreussler India Pvt Ltd (candidate)", brandName: "Kreussler",
    verification: "pending_review",
    fields: {
      legalName: true, brandName: true, manufacturer: true, distributor: false, country: true,
      website: true, contact: true, relationships: true, catalogue: true, kitInformation: true,
      labels: false, sds: false, tds: false, manufacturerInstructions: false,
      countryAvailability: false, trainingRequirements: false, packInformation: true,
      priceInformation: false, reviewerContact: true, verificationStatus: true,
    },
  },
];

/* ------------------------------------------------------------------ */
/* 6. Kit and product intake steps                                     */
/* ------------------------------------------------------------------ */

export const PRODUCT_INTAKE_STEPS = [
  "verify_company_identity", "create_company_record", "create_kit_record", "create_product_records",
  "verify_names_and_codes", "create_country_versions", "upload_label_sds_tds",
  "extract_structured_information", "review_extracted_fields", "record_textile_colour_restrictions",
  "record_process_restrictions", "record_ppe_ventilation", "record_incompatibilities",
  "record_rinsing_neutralization", "create_provisional_mappings", "technical_review",
  "safety_review", "approve_eligible_mappings", "monitor_outcomes",
] as const;
export type ProductIntakeStep = (typeof PRODUCT_INTAKE_STEPS)[number];

export const COMPETITOR_COPY_FORBIDDEN =
  "Mappings may not be copied from a competitor's similar product. Each product requires its own documented evidence.";

/* ------------------------------------------------------------------ */
/* 7. Reformulation                                                    */
/* ------------------------------------------------------------------ */

export const REFORMULATION_COMPARISONS = [
  "hazards", "fabric_restrictions", "process_compatibility", "ppe", "application_instructions",
] as const;
export type ReformulationComparison = (typeof REFORMULATION_COMPARISONS)[number];

export const REFORMULATION_DEPENDENTS = [
  "product_mappings", "kit_comparisons", "training_content",
] as const;

export type ProductVersionRecord = {
  productId: string;
  version: string;
  immutable: true;
  supersededBy?: string;
  documents: { label: boolean; sds: boolean; tds: boolean; instructions: boolean };
  actionable: boolean;
  approvedBy?: string;
};

export const PRODUCT_VERSION_LEDGER: ProductVersionRecord[] = [
  { productId: "PRD-SEITZ-01", version: "1.0.0", immutable: true, supersededBy: "2.0.0", documents: { label: true, sds: false, tds: false, instructions: false }, actionable: false },
  { productId: "PRD-SEITZ-01", version: "2.0.0", immutable: true, documents: { label: true, sds: false, tds: false, instructions: false }, actionable: false },
  { productId: "PRD-CC-03", version: "1.0.0", immutable: true, documents: { label: true, sds: false, tds: false, instructions: false }, actionable: false },
];

/* ------------------------------------------------------------------ */
/* 8. Country expansion                                                */
/* ------------------------------------------------------------------ */

export const COUNTRY_READINESS_CHECKS = [
  "product_availability", "applicable_formulations", "applicable_labels", "sds_jurisdiction",
  "applicable_tds", "emergency_information", "local_cleaning_processes", "professional_terminology",
  "common_garment_types", "care_label_availability", "common_local_stains",
  "household_product_availability", "measurement_units", "language", "regulatory_review",
  "technical_reviewer", "safety_reviewer", "support_capability", "privacy_requirements",
  "data_retention_requirements",
] as const;
export type CountryReadinessCheck = (typeof COUNTRY_READINESS_CHECKS)[number];

export type CountryProfile = {
  code: string;
  name: string;
  status: "live" | "candidate" | "blocked";
  checks: Partial<Record<CountryReadinessCheck, boolean>>;
  rollbackTested: boolean;
};

const allChecks = (value: boolean) =>
  Object.fromEntries(COUNTRY_READINESS_CHECKS.map((c) => [c, value])) as Record<CountryReadinessCheck, boolean>;

export const COUNTRY_PROFILES: CountryProfile[] = [
  { code: "IN", name: "India", status: "live", checks: allChecks(true), rollbackTested: true },
  {
    code: "AE", name: "United Arab Emirates", status: "candidate", rollbackTested: false,
    checks: { ...allChecks(false), product_availability: true, language: true, measurement_units: true, common_garment_types: true },
  },
];

/* ------------------------------------------------------------------ */
/* 9. Language expansion                                               */
/* ------------------------------------------------------------------ */

export const TRANSLATION_PIPELINE = [
  "source_approved", "glossary_prepared", "translation_assigned", "translation_completed",
  "technical_terms_reviewed", "safety_warnings_reviewed", "product_names_preserved",
  "units_verified", "interface_tested", "uat_completed", "translation_approved",
  "published_by_country_language", "monitored_for_misunderstanding",
] as const;
export type TranslationStage = (typeof TRANSLATION_PIPELINE)[number];

export type TranslationJob = {
  id: string;
  language: string;
  country: string;
  sourceVersion: string;
  stage: TranslationStage;
  machineOnly: boolean;
  safetyCritical: boolean;
  outdated: boolean;
  approvedBy?: string;
};

export const TRANSLATION_JOBS: TranslationJob[] = [
  { id: "TR-HI-001", language: "hi", country: "IN", sourceVersion: "1.0.0", stage: "technical_terms_reviewed", machineOnly: false, safetyCritical: true, outdated: false },
  { id: "TR-HI-002", language: "hi", country: "IN", sourceVersion: "1.0.0", stage: "translation_completed", machineOnly: false, safetyCritical: false, outdated: false },
  { id: "TR-MR-001", language: "mr", country: "IN", sourceVersion: "1.0.0", stage: "translation_assigned", machineOnly: false, safetyCritical: false, outdated: false },
];

export const LANGUAGE_PRIORITY = ["hi", "mr", "bn", "ta", "te"] as const;

/* ------------------------------------------------------------------ */
/* 10. Controlled terminology glossary                                 */
/* ------------------------------------------------------------------ */

export type GlossaryEntry = {
  sourceTerm: string;
  targetTerm: string;
  language: string;
  country: string;
  definition: string;
  context: string;
  prohibitedMistranslations: string[];
  reviewer: string;
  version: string;
};

const hi = (
  sourceTerm: string, targetTerm: string, definition: string, context: string,
  prohibited: string[],
): GlossaryEntry => ({
  sourceTerm, targetTerm, language: "hi", country: "IN", definition, context,
  prohibitedMistranslations: prohibited, reviewer: "tech_reviewer_hi_01", version: "1.0.0",
});

export const GLOSSARY: GlossaryEntry[] = [
  hi("Stain", "दाग", "A localised deposit of foreign material on a textile.", "General", ["गंदगी"]),
  hi("Fabric", "कपड़ा", "The constructed textile material.", "General", ["धागा"]),
  hi("Fibre", "रेशा", "The raw material the yarn is made from.", "Technical", ["कपड़ा"]),
  hi("Dye bleeding", "रंग निकलना", "Colour migrating from the garment into water or another area.", "Safety", ["रंग उड़ना"]),
  hi("Dye loss", "रंग उड़ना", "Permanent loss of the garment's own colour.", "Safety", ["रंग निकलना"]),
  hi("Heat-set", "गर्मी से पक्का", "A stain fixed by heat and now far harder to remove.", "Technical", ["सूखा"]),
  hi("Blot", "थपथपाकर सोखना", "Absorb without rubbing.", "Instruction", ["रगड़ना"]),
  hi("Rinse", "धोकर निकालना", "Remove residues with clean water.", "Instruction", ["भिगोना"]),
  hi("Flush", "बहाकर निकालना", "Push the stain out with a stream of liquid from behind.", "Instruction", ["डुबोना"]),
  hi("Neutralize", "उदासीन करना", "Bring residual chemistry back to a safe pH.", "Safety", ["साफ़ करना"]),
  hi("Professional treatment", "पेशेवर उपचार", "Treatment by a trained operator with verified products.", "Access", ["घरेलू उपचार"]),
  hi("Domestic treatment", "घरेलू उपचार", "A method approved for home use at 9/10 confidence.", "Access", ["पेशेवर उपचार"]),
  hi("Stop treatment", "उपचार रोकें", "Cease immediately; further action risks damage.", "Safety", ["रुकिए थोड़ा"]),
  hi("Hidden-area test", "छिपे हिस्से पर जाँच", "Test on an unseen seam before treating.", "Instruction", ["नमूना"]),
  hi("PPE", "सुरक्षा उपकरण", "Personal protective equipment.", "Safety", ["वर्दी"]),
  hi("Ventilation", "हवादार जगह", "Adequate air movement during chemical use.", "Safety", ["पंखा"]),
  hi("Oxidation", "ऑक्सीकरण", "Chemistry that breaks colour bodies by adding oxygen.", "Technical", ["ब्लीच"]),
  hi("Reduction", "अपचयन", "Chemistry that removes oxygen to strip colour bodies.", "Technical", ["सफ़ाई"]),
  hi("Solvent", "विलायक", "A liquid that dissolves oily or resinous soils.", "Technical", ["तेल"]),
  hi("Care label", "देखभाल लेबल", "The manufacturer's care instruction label.", "General", ["ब्रांड लेबल"]),
  hi("Coating", "कोटिंग", "A surface film applied to the fabric.", "Technical", ["रंग"]),
  hi("Lamination", "लेमिनेशन", "A bonded film layer within the fabric.", "Technical", ["कोटिंग"]),
  hi("Adhesive", "चिपकाने वाला पदार्थ", "Glue-type material bonded to the textile.", "Technical", ["गोंद जैसा दाग"]),
  hi("Escalation", "आगे भेजना", "Referral to a supervisor or specialist.", "Process", ["शिकायत"]),
];

export const GLOSSARY_TERMS = GLOSSARY.map((g) => g.sourceTerm);

/* ------------------------------------------------------------------ */
/* 11. Content production pipeline                                     */
/* ------------------------------------------------------------------ */

export const PIPELINE_STAGES = [
  "requested", "accepted", "researching", "evidence_required", "drafting", "technical_review",
  "safety_review", "country_review", "translation", "testing", "approved", "scheduled",
  "published", "monitoring", "needs_review", "suspended",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PUBLISH_FORBIDDEN_FROM: PipelineStage[] = ["researching", "drafting", "requested", "accepted", "evidence_required"];

export type PipelineItem = { id: string; title: string; stage: PipelineStage; owner: string; ageDays: number };

export const PIPELINE_ITEMS: PipelineItem[] = [
  { id: "PL-01", title: "Paan / betel stain", stage: "researching", owner: "content_admin_01", ageDays: 9 },
  { id: "PL-02", title: "Coconut hair oil", stage: "drafting", owner: "content_admin_01", ageDays: 6 },
  { id: "PL-03", title: "Kumkum", stage: "evidence_required", owner: "content_admin_02", ageDays: 21 },
  { id: "PL-04", title: "Hindi safety warnings", stage: "translation", owner: "translator_hi_01", ageDays: 12 },
  { id: "PL-05", title: "Seitz kit mappings", stage: "evidence_required", owner: "tech_reviewer_01", ageDays: 34 },
  { id: "PL-06", title: "Ink (ballpoint) refresh", stage: "technical_review", owner: "tech_reviewer_01", ageDays: 4 },
  { id: "PL-07", title: "Rust removal safety rule", stage: "safety_review", owner: "safety_reviewer_01", ageDays: 3 },
  { id: "PL-08", title: "Holi colour powder", stage: "requested", owner: "unassigned", ageDays: 2 },
  { id: "PL-09", title: "Pilot 36 records", stage: "monitoring", owner: "content_admin_01", ageDays: 15 },
];

/* ------------------------------------------------------------------ */
/* 12. Quality scorecard                                               */
/* ------------------------------------------------------------------ */

export const SCORECARD_CHECKS = [
  "identity", "classification", "chemistry", "fabric_risks", "colour_risks", "construction_risks",
  "heat", "ageing", "previous_treatment", "first_response", "prohibitions", "outcome",
  "escalation", "sources", "reviewer", "country", "translation", "product_mappings",
  "domestic_status", "review_date",
] as const;
export type ScorecardCheck = (typeof SCORECARD_CHECKS)[number];

export const READINESS_LABELS = [
  "Incomplete", "Research Ready", "Review Ready", "Approved", "Publishable", "Published", "Needs Review",
] as const;
export type ReadinessLabel = (typeof READINESS_LABELS)[number];

/* ------------------------------------------------------------------ */
/* 13. Reviewer capacity                                               */
/* ------------------------------------------------------------------ */

export type Reviewer = {
  id: string;
  name: string;
  scopes: string[];
  countries: string[];
  languages: string[];
  assigned: number;
  avgReviewDays: number;
  overdue: number;
  highRiskBacklog: number;
  qualificationExpiry: string;
  conflictDeclared: boolean;
};

export const REVIEWERS: Reviewer[] = [
  { id: "REV-01", name: "Technical Reviewer — Textiles", scopes: ["stain", "mapping", "product"], countries: ["IN"], languages: ["en"], assigned: 11, avgReviewDays: 3.4, overdue: 1, highRiskBacklog: 2, qualificationExpiry: "2027-03-31", conflictDeclared: true },
  { id: "REV-02", name: "Safety Reviewer — Chemistry", scopes: ["safety_rule", "domestic", "ppe"], countries: ["IN"], languages: ["en"], assigned: 7, avgReviewDays: 2.1, overdue: 0, highRiskBacklog: 1, qualificationExpiry: "2026-11-30", conflictDeclared: true },
  { id: "REV-03", name: "Country Reviewer — India", scopes: ["country", "regulatory"], countries: ["IN"], languages: ["en", "hi"], assigned: 4, avgReviewDays: 5.0, overdue: 2, highRiskBacklog: 0, qualificationExpiry: "2026-09-30", conflictDeclared: false },
  { id: "REV-04", name: "Translation Reviewer — Hindi", scopes: ["translation"], countries: ["IN"], languages: ["hi"], assigned: 6, avgReviewDays: 4.2, overdue: 1, highRiskBacklog: 1, qualificationExpiry: "2027-01-31", conflictDeclared: false },
];

/** Sustainable throughput: items a reviewer can safely hold at once. */
export const REVIEW_CAPACITY_PER_REVIEWER = 12;

/* ------------------------------------------------------------------ */
/* 14. Service priorities                                              */
/* ------------------------------------------------------------------ */

export const SERVICE_PRIORITIES = ["critical", "high", "medium", "normal", "low"] as const;
export type ServicePriority = (typeof SERVICE_PRIORITIES)[number];

export const SERVICE_PRIORITY_META: Record<ServicePriority, { label: string; definition: string; suspensionAllowed: boolean; responseCommitment: string | null }> = {
  critical: { label: "Critical", definition: "Hazardous or garment-damage concern.", suspensionAllowed: true, responseCommitment: "Immediate suspension available; staffed during operating hours." },
  high: { label: "High", definition: "Incorrect live instruction or document conflict.", suspensionAllowed: true, responseCommitment: null },
  medium: { label: "Medium", definition: "Missing content, translation or product.", suspensionAllowed: false, responseCommitment: null },
  normal: { label: "Normal", definition: "Enhancement or new request.", suspensionAllowed: false, responseCommitment: null },
  low: { label: "Low", definition: "Cosmetic improvement.", suspensionAllowed: false, responseCommitment: null },
};

/* ------------------------------------------------------------------ */
/* 15-16. AI boundaries and human review                               */
/* ------------------------------------------------------------------ */

export const AI_ALLOWED = [
  "document_extraction", "search_synonyms", "duplicate_detection", "draft_summaries",
  "candidate_stain_suggestions", "translation_drafts", "evidence_gap_detection",
  "rule_test_generation", "outcome_clustering", "content_quality_checks",
] as const;
export type AiAllowedAction = (typeof AI_ALLOWED)[number];

export const AI_FORBIDDEN = [
  "publish_treatment", "approve_domestic_confidence", "approve_product_mapping",
  "approve_safety_rules", "invent_chemical_details", "confirm_fabric_from_appearance",
  "confirm_chemistry_from_photograph", "override_stop_rule", "rank_products_without_evidence",
  "resolve_conflicting_sds_tds", "approve_translation",
] as const;
export type AiForbiddenAction = (typeof AI_FORBIDDEN)[number];

export const HUMAN_APPROVAL_REQUIRED = [
  "treatment_procedures", "domestic_methods", "high_risk_first_responses", "product_compatibility",
  "ppe", "chemical_incompatibilities", "rinsing_and_neutralization", "oxidation_and_reduction",
  "leather_suede_coated_guidance", "product_rankings", "safety_rules", "translated_warnings",
  "corrective_actions", "emergency_suspension_closure",
] as const;
export type HumanApprovalArea = (typeof HUMAN_APPROVAL_REQUIRED)[number];

/* ------------------------------------------------------------------ */
/* 17. Data architecture capabilities                                  */
/* ------------------------------------------------------------------ */

export type ArchitectureCapability = {
  key: string;
  label: string;
  supported: boolean;
  mechanism: string;
  limit: string;
};

export const ARCHITECTURE_CAPABILITIES: ArchitectureCapability[] = [
  { key: "pagination", label: "Pagination", supported: true, mechanism: "Range-based paging on all list endpoints", limit: "Page size capped at 100 rows" },
  { key: "indexed_search", label: "Indexed search", supported: true, mechanism: "Indexed name/alias/source columns plus normalised search keys", limit: "Full-text ranking not yet enabled" },
  { key: "structured_filtering", label: "Structured filtering", supported: true, mechanism: "Typed columns and enums, not JSON scans", limit: "—" },
  { key: "many_to_many", label: "Many-to-many stain mappings", supported: true, mechanism: "product_mappings / stain_stage_links join tables", limit: "—" },
  { key: "immutable_content_versions", label: "Immutable content versions", supported: true, mechanism: "governance_versions append-only", limit: "—" },
  { key: "immutable_product_versions", label: "Immutable product versions", supported: true, mechanism: "product_versions append-only", limit: "—" },
  { key: "country_documents", label: "Country-specific documents", supported: true, mechanism: "product_country_applicability + source_documents", limit: "One jurisdiction per document row" },
  { key: "multiple_translations", label: "Multiple translations", supported: true, mechanism: "stain_translations keyed by language + source version", limit: "—" },
  { key: "organization_isolation", label: "Organization isolation", supported: true, mechanism: "RLS scoped to organization membership", limit: "—" },
  { key: "case_snapshots", label: "Historical case snapshots", supported: true, mechanism: "governance_case_snapshots stores resolved versions", limit: "—" },
  { key: "large_document_storage", label: "Large document storage", supported: true, mechanism: "Private storage bucket with signed access", limit: "50 MB per document" },
  { key: "outcome_aggregation", label: "Outcome aggregation", supported: true, mechanism: "treatment_outcomes with reviewed flag", limit: "Aggregates computed on read; needs materialisation beyond ~100k rows" },
  { key: "audit_growth", label: "Audit growth", supported: true, mechanism: "Append-only audit tables", limit: "Partitioning required beyond ~5M rows" },
  { key: "background_processing", label: "Background processing", supported: true, mechanism: "Edge-function jobs with visible backlog", limit: "No distributed queue; single-region workers" },
  { key: "safe_migrations", label: "Safe migrations", supported: true, mechanism: "Additive migrations with rollback scripts", limit: "—" },
  { key: "data_export", label: "Data export", supported: true, mechanism: "Scoped export per organization", limit: "—" },
  { key: "backup_restore", label: "Backup and restoration", supported: true, mechanism: "Managed daily backups + restore rehearsal", limit: "RPO 24h on the current plan" },
];

export const NO_JSON_SAFETY_RULE =
  "Safety-critical relationships are stored in typed columns and join tables, never only inside unstructured JSON.";

/* ------------------------------------------------------------------ */
/* 18. Search scaling                                                  */
/* ------------------------------------------------------------------ */

export const SEARCH_KEYS = [
  "canonical_name", "alternative_names", "local_names", "transliteration", "misspellings",
  "source_terms", "categories", "components", "tags", "product_names", "stable_ids",
] as const;
export type SearchKey = (typeof SEARCH_KEYS)[number];

export const SEARCH_SUGGESTION_DISCLAIMER =
  "Suggestions are possible matches only. The stain is not identified until you confirm it.";

/* ------------------------------------------------------------------ */
/* 19. Image / AI scaling                                              */
/* ------------------------------------------------------------------ */

export const PHOTO_CANDIDATE_CEILING = 3;
export const PHOTO_CONFIDENCE_CEILING = 6; // out of 10, photograph-only

export type ModelRelease = { model: string; version: string; activatedOn: string; revalidated: boolean; historicalCasesFrozen: true };

export const MODEL_RELEASES: ModelRelease[] = [
  { model: "vision-stain-candidates", version: "2026.03", activatedOn: "2026-03-02", revalidated: true, historicalCasesFrozen: true },
  { model: "vision-stain-candidates", version: "2026.07", activatedOn: "2026-07-14", revalidated: true, historicalCasesFrozen: true },
];

/* ------------------------------------------------------------------ */
/* 20. Safety rule scaling                                             */
/* ------------------------------------------------------------------ */

export const RULE_UPDATE_STEPS = [
  "create_draft_version", "run_regression_tests", "run_case_simulations", "compare_decisions",
  "detect_unintended_risk_reduction", "technical_and_safety_review", "schedule_activation",
  "monitor_post_release", "preserve_rollback", "preserve_historical_evaluations",
] as const;
export type RuleUpdateStep = (typeof RULE_UPDATE_STEPS)[number];

export const ACTIVE_RULES_ARE_IMMUTABLE = true;

/* ------------------------------------------------------------------ */
/* 21-22. Organization scaling                                         */
/* ------------------------------------------------------------------ */

export const ORG_ONBOARDING_CHECKS = [
  "identity", "country", "locations", "users", "roles", "supervisors", "cleaning_processes",
  "machine_types", "equipment", "ppe", "ventilation", "product_inventory", "product_versions",
  "documents", "staff_training", "escalation_route", "data_retention", "privacy_agreement",
  "test_cases",
] as const;
export type OrgOnboardingCheck = (typeof ORG_ONBOARDING_CHECKS)[number];

/** Without these, professional treatment access stays off. */
export const ORG_ACTIVATION_REQUIRED: OrgOnboardingCheck[] = [
  "identity", "country", "users", "roles", "supervisors", "product_inventory", "product_versions",
  "documents", "staff_training", "escalation_route", "privacy_agreement", "test_cases",
];

export type OrganizationRecord = {
  id: string;
  name: string;
  country: string;
  locations: string[];
  checks: Partial<Record<OrgOnboardingCheck, boolean>>;
  professionalAccess: boolean;
  caseIds: string[];
};

export const ORGANIZATIONS: OrganizationRecord[] = [
  {
    id: "ORG-001", name: "Pilot Dry Cleaners (Delhi)", country: "IN",
    locations: ["LOC-001", "LOC-002", "LOC-003"], professionalAccess: true,
    checks: Object.fromEntries(ORG_ONBOARDING_CHECKS.map((c) => [c, true])) as Record<OrgOnboardingCheck, boolean>,
    caseIds: ["CASE-1001", "CASE-1002"],
  },
  {
    id: "ORG-002", name: "Metro Laundry (Pune)", country: "IN",
    locations: ["LOC-010"], professionalAccess: false,
    checks: { identity: true, country: true, locations: true, users: true, roles: true, supervisors: false, product_inventory: false, product_versions: false, documents: false, staff_training: false, escalation_route: false, privacy_agreement: true, test_cases: false },
    caseIds: ["CASE-2001"],
  },
];

/* ------------------------------------------------------------------ */
/* 23-24. Training and competency                                      */
/* ------------------------------------------------------------------ */

export const LEARNING_PATHS = [
  "laundry_counter_employee", "dry_cleaning_operator", "professional_spotter", "supervisor",
  "trainer", "product_document_reviewer", "safety_reviewer", "content_administrator",
] as const;
export type LearningPath = (typeof LEARNING_PATHS)[number];

export const TRAINING_TOPICS = [
  "fabric_risk_assessment", "no_label_workflow", "stain_identification", "heat_warnings",
  "chemical_incompatibilities", "product_verification", "compatibility_testing",
  "inspection_and_stop_conditions", "damage_recognition", "case_documentation", "escalation",
] as const;
export type TrainingTopic = (typeof TRAINING_TOPICS)[number];

export type Competency = {
  userId: string;
  path: LearningPath;
  country: string;
  expiresOn: string;
  refresherRequired: boolean;
  supervisorApproved: boolean;
  grantsPermissions: string[];
};

export const COMPETENCIES: Competency[] = [
  { userId: "USR-201", path: "professional_spotter", country: "IN", expiresOn: "2027-01-31", refresherRequired: false, supervisorApproved: true, grantsPermissions: ["professional_treatment", "chemical_application"] },
  { userId: "USR-202", path: "dry_cleaning_operator", country: "IN", expiresOn: "2026-06-30", refresherRequired: true, supervisorApproved: true, grantsPermissions: ["professional_treatment"] },
  { userId: "USR-203", path: "laundry_counter_employee", country: "IN", expiresOn: "2027-05-31", refresherRequired: false, supervisorApproved: true, grantsPermissions: ["case_intake"] },
];

/* ------------------------------------------------------------------ */
/* 25-28. Metrics                                                      */
/* ------------------------------------------------------------------ */

export type Metric = {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  definition: string;
  sampleSize: number;
  dateRange: string;
  family: "quality" | "safety" | "sustainability";
};

export const METRICS: Metric[] = [
  { key: "records_current_evidence", label: "Published records with current evidence", value: 100, unit: "%", definition: "Published records whose cited sources are within their review window.", sampleSize: 42, dateRange: "2026-07-01 to 2026-08-17", family: "quality" },
  { key: "records_past_review", label: "Records past review date", value: 0, unit: "%", definition: "Published records whose next review date has passed.", sampleSize: 42, dateRange: "2026-07-01 to 2026-08-17", family: "quality" },
  { key: "mappings_complete_documents", label: "Product mappings with complete documents", value: 0, unit: "%", definition: "Approved mappings whose product has label, SDS and TDS on file.", sampleSize: 0, dateRange: "2026-07-01 to 2026-08-17", family: "quality" },
  { key: "domestic_at_9", label: "Domestic methods at or above 9/10", value: 100, unit: "%", definition: "Published domestic methods meeting the 9/10 confidence gate.", sampleSize: 5, dateRange: "2026-07-01 to 2026-08-17", family: "quality" },
  { key: "search_success", label: "Search success rate", value: 92.4, unit: "%", definition: "Searches returning at least one record the user then opened.", sampleSize: 1846, dateRange: "2026-07-01 to 2026-08-17", family: "quality" },
  { key: "unknown_stain_rate", label: "Unknown-stain rate", value: 11.2, unit: "%", definition: "Cases routed to the Unknown diagnostic record.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "quality" },
  { key: "unknown_fabric_rate", label: "Unknown-fabric rate", value: 18.7, unit: "%", definition: "Cases where fibre composition could not be confirmed.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "quality" },
  { key: "referral_rate", label: "Professional-referral rate", value: 26.5, unit: "%", definition: "Domestic cases referred to a professional.", sampleSize: 249, dateRange: "2026-07-01 to 2026-08-17", family: "quality" },
  { key: "stop_usage", label: "Stop-condition usage", value: 8.3, unit: "%", definition: "Cases where a Stop condition was displayed.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "quality" },
  { key: "review_turnaround", label: "Review turnaround", value: 3.6, unit: "days", definition: "Mean days from review assignment to decision.", sampleSize: 28, dateRange: "2026-07-01 to 2026-08-17", family: "quality" },
  { key: "translation_currency", label: "Translation currency", value: 0, unit: "%", definition: "Translations approved against the current source version.", sampleSize: 3, dateRange: "2026-07-01 to 2026-08-17", family: "quality" },
  { key: "rule_test_pass", label: "Rule-test pass rate", value: 100, unit: "%", definition: "Safety rule regression tests passing on the active rule set.", sampleSize: 129, dateRange: "2026-08-01 to 2026-08-17", family: "quality" },
  { key: "rollback_rate", label: "Release rollback rate", value: 0, unit: "%", definition: "Releases rolled back after publication.", sampleSize: 4, dateRange: "2026-06-01 to 2026-08-17", family: "quality" },

  { key: "dangerous_mixing", label: "Dangerous-mixing reports", value: 0, unit: "count", definition: "User reports of mixing incompatible chemistry.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "safety" },
  { key: "heat_violations", label: "Heat-rule violations", value: 2, unit: "count", definition: "Cases where heat was applied against a displayed heat warning.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "safety" },
  { key: "active_bleeding", label: "Active dye-bleeding cases", value: 9, unit: "count", definition: "Cases reporting live colour migration.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "safety" },
  { key: "treatment_after_stop", label: "Treatment after Stop warning", value: 1, unit: "count", definition: "Recorded treatment continuing past a Stop instruction.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "safety" },
  { key: "missing_ppe", label: "Missing-PPE attempts", value: 3, unit: "count", definition: "Blocked attempts without required PPE confirmation.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "safety" },
  { key: "missing_document_blocks", label: "Missing-document blocks", value: 64, unit: "count", definition: "Product options withheld for missing label/SDS/TDS.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "safety" },
  { key: "country_mismatch_blocks", label: "Country-mismatch blocks", value: 5, unit: "count", definition: "Content withheld for country inapplicability.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "safety" },
  { key: "unauthorized_attempts", label: "Unauthorized-content attempts", value: 7, unit: "count", definition: "Blocked attempts to reach restricted technical content.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "safety" },
  { key: "separation_failures", label: "Domestic/professional separation failures", value: 0, unit: "count", definition: "Confirmed leaks of professional content to domestic users.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "safety" },
  { key: "adverse_outcomes", label: "Adverse outcomes", value: 0, unit: "count", definition: "Reported garment damage attributed to guidance.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "safety" },
  { key: "hazard_referrals", label: "Hazard referrals", value: 4, unit: "count", definition: "Cases escalated as a potential hazard.", sampleSize: 412, dateRange: "2026-07-01 to 2026-08-17", family: "safety" },
  { key: "emergency_suspensions", label: "Emergency suspensions", value: 1, unit: "count", definition: "Content suspended immediately for safety.", sampleSize: 42, dateRange: "2026-07-01 to 2026-08-17", family: "safety" },

  { key: "content_reuse", label: "Content reuse across companies", value: 100, unit: "%", definition: "Stain records reused unchanged when a company is added.", sampleSize: 42, dateRange: "2026-07-01 to 2026-08-17", family: "sustainability" },
  { key: "duplicate_reduction", label: "Duplicate-record reduction", value: 6, unit: "count", definition: "Intake duplicates merged instead of created.", sampleSize: 6, dateRange: "2026-07-01 to 2026-08-17", family: "sustainability" },
  { key: "document_reuse", label: "Document reuse", value: 3, unit: "count", definition: "Documents shared across multiple products.", sampleSize: 16, dateRange: "2026-07-01 to 2026-08-17", family: "sustainability" },
  { key: "product_dose", label: "Product dose", value: null, unit: "ml/garment", definition: "Not measurable until verified product instructions exist.", sampleSize: 0, dateRange: "—", family: "sustainability" },
  { key: "packaging", label: "Packaging", value: null, unit: "g/garment", definition: "No verified pack data.", sampleSize: 0, dateRange: "—", family: "sustainability" },
  { key: "waste", label: "Waste", value: null, unit: "g/garment", definition: "No measurement method defined.", sampleSize: 0, dateRange: "—", family: "sustainability" },
  { key: "water", label: "Water", value: null, unit: "L/garment", definition: "No metering in pilot organizations.", sampleSize: 0, dateRange: "—", family: "sustainability" },
  { key: "energy", label: "Energy", value: null, unit: "kWh/garment", definition: "No metering in pilot organizations.", sampleSize: 0, dateRange: "—", family: "sustainability" },
  { key: "process_burden", label: "Process burden", value: null, unit: "index", definition: "Requires verified process data.", sampleSize: 0, dateRange: "—", family: "sustainability" },
  { key: "cost_per_treatment", label: "Cost per treatment", value: null, unit: "INR", definition: "Requires verified product prices and doses.", sampleSize: 0, dateRange: "—", family: "sustainability" },
  { key: "recovery_vs_replacement", label: "Garment recovery vs replacement", value: null, unit: "%", definition: "Requires responsibly measured outcome follow-up.", sampleSize: 0, dateRange: "—", family: "sustainability" },
];

export const ENVIRONMENTAL_CLAIM_RULE =
  "Environmental claims are not published without a defined measurement method and supporting evidence.";

/* ------------------------------------------------------------------ */
/* 29. Platform reliability                                            */
/* ------------------------------------------------------------------ */

export type MonitorDefinition = { key: string; label: string; threshold: string; failClosed: boolean; configured: boolean };

export const MONITORS: MonitorDefinition[] = [
  { key: "availability", label: "Availability", threshold: "99.5% monthly", failClosed: false, configured: true },
  { key: "search_performance", label: "Search performance", threshold: "p95 < 800 ms", failClosed: false, configured: true },
  { key: "database_performance", label: "Database performance", threshold: "p95 query < 250 ms", failClosed: false, configured: true },
  { key: "safety_engine_latency", label: "Safety-engine latency", threshold: "p95 < 400 ms", failClosed: false, configured: true },
  { key: "safety_engine_failure", label: "Safety-engine failure", threshold: "Any failure blocks actionable treatment", failClosed: true, configured: true },
  { key: "document_processing_failure", label: "Document-processing failure", threshold: "< 2% of jobs", failClosed: false, configured: true },
  { key: "upload_failure", label: "Upload failure", threshold: "< 1% of uploads", failClosed: false, configured: true },
  { key: "notification_failure", label: "Notification failure", threshold: "< 2% of sends", failClosed: false, configured: true },
  { key: "translation_job_failure", label: "Translation-job failure", threshold: "< 5% of jobs", failClosed: false, configured: true },
  { key: "background_backlog", label: "Background-job backlog", threshold: "< 50 queued jobs", failClosed: false, configured: true },
  { key: "storage_capacity", label: "Storage capacity", threshold: "< 80% used", failClosed: false, configured: true },
  { key: "error_rate", label: "Error rate", threshold: "< 1% of requests", failClosed: false, configured: true },
  { key: "permission_denied_anomaly", label: "Permission-denied anomalies", threshold: "Alert on 3x baseline", failClosed: false, configured: true },
  { key: "offline_sync_conflicts", label: "Offline-sync conflicts", threshold: "Manual resolution queue", failClosed: false, configured: false },
];

/* ------------------------------------------------------------------ */
/* 30. Backup and recovery                                             */
/* ------------------------------------------------------------------ */

export type BackupTarget = { key: string; label: string; frequency: string; restoreTested: boolean; testedOn: string | null };

export const BACKUP_TARGETS: BackupTarget[] = [
  { key: "database", label: "Database backups", frequency: "Daily managed snapshot", restoreTested: true, testedOn: "2026-08-14" },
  { key: "files", label: "File backups", frequency: "Daily object replication", restoreTested: true, testedOn: "2026-08-14" },
  { key: "source_documents", label: "Source-document backups", frequency: "Daily object replication", restoreTested: true, testedOn: "2026-08-14" },
  { key: "configuration", label: "Configuration backups", frequency: "On change, versioned in repo", restoreTested: true, testedOn: "2026-08-15" },
  { key: "rule_sets", label: "Rule-set backups", frequency: "Every rule version, immutable", restoreTested: true, testedOn: "2026-08-15" },
  { key: "audit_logs", label: "Audit-log preservation", frequency: "Append-only, never truncated", restoreTested: true, testedOn: "2026-08-15" },
];

export const RECOVERY_OBJECTIVES = { rpoHours: 24, rtoHours: 4, approver: "system_administrator", emergencyContacts: ["platform_oncall", "safety_reviewer_01", "content_admin_01"] };

/* ------------------------------------------------------------------ */
/* 31. Migration safety                                                */
/* ------------------------------------------------------------------ */

export const MIGRATION_CHECKS = [
  "backup_affected_data", "test_on_non_production_copy", "validate_stable_ids", "validate_version_links",
  "validate_organization_boundaries", "validate_permissions", "validate_historical_cases",
  "validate_safety_rules", "prepare_rollback", "monitor_after_release",
] as const;
export type MigrationCheck = (typeof MIGRATION_CHECKS)[number];

export type MigrationRecord = { id: string; description: string; destructive: boolean; checks: Record<MigrationCheck, boolean>; rollbackTested: boolean };

const fullChecks = Object.fromEntries(MIGRATION_CHECKS.map((c) => [c, true])) as Record<MigrationCheck, boolean>;

export const MIGRATION_LEDGER: MigrationRecord[] = [
  { id: "MIG-2026-08-16-a", description: "Add scaling intake and glossary tables (additive)", destructive: false, checks: fullChecks, rollbackTested: true },
  { id: "MIG-2026-08-16-b", description: "Add search normalisation indexes (additive)", destructive: false, checks: fullChecks, rollbackTested: true },
];

/* ------------------------------------------------------------------ */
/* 32. Integrations                                                    */
/* ------------------------------------------------------------------ */

export const INTEGRATION_REQUIREMENTS = [
  "versioned_api", "authentication", "least_privilege", "rate_limiting", "audit_logging",
  "data_minimization", "country_and_org_boundaries", "revocable_access", "safe_failure",
] as const;
export type IntegrationRequirement = (typeof INTEGRATION_REQUIREMENTS)[number];

export type IntegrationPoint = {
  key: string;
  label: string;
  scopes: string[];
  requirements: Record<IntegrationRequirement, boolean>;
  publiclyExposed: boolean;
  enabled: boolean;
};

const reqs = (overrides: Partial<Record<IntegrationRequirement, boolean>> = {}) =>
  ({ ...Object.fromEntries(INTEGRATION_REQUIREMENTS.map((r) => [r, true])), ...overrides }) as Record<IntegrationRequirement, boolean>;

export const INTEGRATION_POINTS: IntegrationPoint[] = [
  { key: "document_provider", label: "Product-document providers", scopes: ["documents:write_draft"], requirements: reqs(), publiclyExposed: false, enabled: false },
  { key: "org_inventory", label: "Organization inventory systems", scopes: ["inventory:read", "inventory:write"], requirements: reqs(), publiclyExposed: false, enabled: false },
  { key: "learning", label: "Learning systems", scopes: ["training:read", "training:write"], requirements: reqs(), publiclyExposed: false, enabled: false },
  { key: "garment_management", label: "Customer garment-management systems", scopes: ["cases:read"], requirements: reqs(), publiclyExposed: false, enabled: false },
  { key: "analytics", label: "Analytics tools", scopes: ["metrics:read"], requirements: reqs(), publiclyExposed: false, enabled: false },
  { key: "manufacturer_updates", label: "Manufacturer updates", scopes: ["documents:write_draft"], requirements: reqs(), publiclyExposed: false, enabled: false },
  { key: "translation", label: "Translation systems", scopes: ["translations:write_draft"], requirements: reqs(), publiclyExposed: false, enabled: false },
];

/* ------------------------------------------------------------------ */
/* 33. Import / export standards                                       */
/* ------------------------------------------------------------------ */

export const PORTABLE_ENTITIES = [
  "stain_records", "product_records", "mapping_records", "document_metadata",
  "domestic_treatments", "outcomes", "translations", "governance_reports",
] as const;
export type PortableEntity = (typeof PORTABLE_ENTITIES)[number];

export const IMPORT_REQUIREMENTS = [
  "schema_version", "validation", "stable_ids", "version_preservation", "duplicate_detection",
  "preview", "draft_only_import", "error_report", "audit_trail",
] as const;

export const IMPORT_SCHEMA_VERSION = "sm-portable-1.0";

/* ------------------------------------------------------------------ */
/* 34. Manufacturer update monitoring                                  */
/* ------------------------------------------------------------------ */

export const UPDATE_SIGNALS = [
  "website_update", "new_label", "new_sds", "new_tds", "discontinuation", "reformulation",
  "new_pack_size", "changed_instructions", "changed_hazards", "changed_country_availability",
] as const;
export type UpdateSignal = (typeof UPDATE_SIGNALS)[number];

/* ------------------------------------------------------------------ */
/* 35. Commercial plans                                                */
/* ------------------------------------------------------------------ */

export const PLAN_CAPABILITIES = [
  "domestic_public_access", "professional_org_access", "technical_library_access",
  "training_access", "multi_location_access", "advanced_reporting", "integration_access",
] as const;
export type PlanCapability = (typeof PLAN_CAPABILITIES)[number];

export type Plan = { key: string; label: string; capabilities: PlanCapability[] };

export const PLANS: Plan[] = [
  { key: "free_domestic", label: "Domestic (free)", capabilities: ["domestic_public_access"] },
  { key: "professional", label: "Professional organization", capabilities: ["domestic_public_access", "professional_org_access", "technical_library_access", "training_access"] },
  { key: "enterprise", label: "Enterprise", capabilities: ["domestic_public_access", "professional_org_access", "technical_library_access", "training_access", "multi_location_access", "advanced_reporting", "integration_access"] },
];

/** Never withheld for payment reasons. */
export const ALWAYS_FREE_CONTENT = ["safety_warnings", "stop_guidance", "hazard_referral", "first_response_do_not"] as const;

/* ------------------------------------------------------------------ */
/* 36. Data portability                                                */
/* ------------------------------------------------------------------ */

export const EXPORTABLE_BY_ORG = ["cases", "inventory", "outcomes", "training_records", "organization_settings"] as const;
export const NEVER_EXPORTABLE = [
  "other_organization_data", "restricted_manufacturer_documents", "internal_reviewer_notes",
  "platform_proprietary_evidence",
] as const;

/* ------------------------------------------------------------------ */
/* 37. Public trust features                                           */
/* ------------------------------------------------------------------ */

export const TRUST_FIELDS = [
  "last_reviewed_date", "country_applicability", "evidence_status", "audience_designation",
  "risk_level", "main_limitation", "report_an_issue", "content_version",
] as const;
export type TrustField = (typeof TRUST_FIELDS)[number];

export const FORBIDDEN_BADGES = ["scientifically proven", "guaranteed removal", "100% safe", "clinically tested"] as const;

/* ------------------------------------------------------------------ */
/* 38-39. Expansion release process and waves                          */
/* ------------------------------------------------------------------ */

export const RELEASE_PROCESS = [
  "define_scope", "confirm_evidence", "confirm_reviewer_capacity", "create_content",
  "technical_review", "safety_review", "country_and_translation_review", "automated_validation",
  "regression_tests", "user_acceptance_testing", "release_candidate", "approve_release",
  "publish_in_phases", "monitor", "pause_or_rollback", "publish_expansion_report",
] as const;
export type ReleaseStep = (typeof RELEASE_PROCESS)[number];

export type Wave = { key: string; label: string; goals: string[]; gatesPassed: boolean; status: "in_progress" | "blocked" | "planned" | "complete" };

export const WAVES: Wave[] = [
  {
    key: "wave1", label: "Wave 1 — Consolidate the pilot", status: "in_progress", gatesPassed: false,
    goals: [
      "Complete the initial 36 stains",
      "Resolve three-kit documentation gaps",
      "Validate Quick Professional Mode",
      "Validate Domestic Mode boundaries",
      "Launch English in India",
    ],
  },
  {
    key: "wave2", label: "Wave 2 — Depth in India", status: "planned", gatesPassed: false,
    goals: [
      "Expand to 75–100 stains",
      "Add Hindi",
      "Add more India-relevant garment types",
      "Add approved training modules",
      "Add selected verified domestic methods",
    ],
  },
  {
    key: "wave3", label: "Wave 3 — Companies and languages", status: "planned", gatesPassed: false,
    goals: [
      "Add new companies and kits",
      "Add additional Indian languages",
      "Add more organization features",
      "Expand controlled internal testing",
    ],
  },
  {
    key: "wave4", label: "Wave 4 — New countries", status: "planned", gatesPassed: false,
    goals: [
      "Add selected new countries",
      "Add country-specific products and documents",
      "Add regional reviewers",
      "Add permitted integrations",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* 40. Long-term targets                                               */
/* ------------------------------------------------------------------ */

export const COMPLETENESS_TARGETS = [
  { key: "complete_evidence", label: "Records with complete evidence", target: 100 },
  { key: "current_review", label: "Records with current review", target: 100 },
  { key: "fabric_risk_detail", label: "Records with fabric-risk detail", target: 100 },
  { key: "realistic_outcomes", label: "Records with realistic outcomes", target: 100 },
  { key: "country_applicability", label: "Records with country applicability", target: 100 },
  { key: "approved_mappings", label: "Records with approved product mappings", target: 80 },
  { key: "reviewed_translations", label: "Records with reviewed translations", target: 100 },
  { key: "monitored_outcomes", label: "Records with monitored outcomes", target: 90 },
] as const;

export const COUNT_IS_NOT_SUCCESS =
  "A smaller complete library is preferable to a larger incomplete library.";

/* ------------------------------------------------------------------ */
/* 42. Final audit areas                                               */
/* ------------------------------------------------------------------ */

export const AUDIT_AREAS = [
  "data_architecture", "stable_ids", "versioning", "historical_reproduction", "stain_taxonomy",
  "fabric_safety_check", "no_label_workflow", "stain_identification", "treatment_changing_information",
  "product_database", "product_mappings", "safety_engine", "role_access", "domestic_separation",
  "treatment_result", "exactly_five_recommendations", "three_kit_comparison", "outcome_monitoring",
  "governance", "administration", "pilot_release", "translation", "country_applicability",
  "security", "privacy", "accessibility", "performance", "backup_and_recovery",
  "suspension_and_rollback",
] as const;
export type AuditArea = (typeof AUDIT_AREAS)[number];

/* ------------------------------------------------------------------ */
/* 43. Timeless architecture                                           */
/* ------------------------------------------------------------------ */

export const ARCHITECTURE_CHAIN = [
  "Stain Knowledge", "Garment and Fabric Risk", "Treatment Principle", "Safety Rules",
  "Verified Product Options", "Role-Appropriate Guidance", "Inspection and Outcome",
  "Governed Improvement",
] as const;

export const ARCHITECTURE_INVARIANTS = [
  { key: "brand_neutral_taxonomy", statement: "No brand defines the universal taxonomy." },
  { key: "company_add_no_rebuild", statement: "No stain page must be rebuilt to add a company." },
  { key: "history_preserved", statement: "No product update rewrites historical cases." },
  { key: "domestic_not_derived", statement: "No domestic method is derived automatically from professional chemistry." },
  { key: "ai_reviewed", statement: "No AI output bypasses human review." },
  { key: "missing_is_not_safe", statement: "No missing information defaults to safe." },
] as const;
