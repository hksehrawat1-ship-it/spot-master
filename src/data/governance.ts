/**
 * STEP 15 — Content governance, review and version control.
 *
 * Permanent principle:
 *   No safety-critical instruction should exist without an owner, evidence,
 *   reviewer, version and review date.
 */

export const GOVERNANCE_SYSTEM_VERSION = "step15-governance-v1";

export const SAFE_FALLBACK_TEXT =
  "This guidance is temporarily unavailable pending technical review.";

export const PREVIEW_WATERMARK = "Preview — Not Published Guidance";

/* ------------------------------------------------------------------ */
/* 2. Governed content types                                           */
/* ------------------------------------------------------------------ */

export const CONTENT_TYPES = [
  "stain_record", "stain_classification", "fabric_record", "fabric_compatibility_rule",
  "first_response", "treatment_principle", "company", "kit", "product", "product_version",
  "product_label", "sds", "tds", "manufacturer_instruction", "product_mapping",
  "product_transition", "domestic_treatment", "household_product", "safety_rule",
  "treatment_pathway", "kit_comparison", "product_ranking", "training_content",
  "translation", "public_content", "faq", "internal_trial", "corrective_action",
  "template_export",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  stain_record: "Stain record", stain_classification: "Stain classification",
  fabric_record: "Fabric record", fabric_compatibility_rule: "Fabric-compatibility rule",
  first_response: "Safe first response", treatment_principle: "Treatment principle",
  company: "Company", kit: "Kit", product: "Product", product_version: "Product version",
  product_label: "Product label", sds: "SDS", tds: "TDS",
  manufacturer_instruction: "Manufacturer instruction", product_mapping: "Product mapping",
  product_transition: "Product transition", domestic_treatment: "Domestic treatment",
  household_product: "Household product", safety_rule: "Safety rule",
  treatment_pathway: "Treatment pathway", kit_comparison: "Three-kit comparison",
  product_ranking: "Product ranking", training_content: "Training content",
  translation: "Translation", public_content: "Public website content", faq: "FAQ",
  internal_trial: "Controlled internal trial", corrective_action: "Corrective action",
  template_export: "Template or export",
};

/** ID prefixes give stable, human-readable record IDs. */
export const ID_PREFIX: Record<ContentType, string> = {
  stain_record: "STN", stain_classification: "CLS", fabric_record: "FAB",
  fabric_compatibility_rule: "FCR", first_response: "FRS", treatment_principle: "PRN",
  company: "COM", kit: "KIT", product: "PRD", product_version: "PVR", product_label: "LBL",
  sds: "SDS", tds: "TDS", manufacturer_instruction: "MFI", product_mapping: "MAP",
  product_transition: "TRN", domestic_treatment: "DOM", household_product: "HHP",
  safety_rule: "SFR", treatment_pathway: "PTH", kit_comparison: "CMP",
  product_ranking: "RNK", training_content: "TRG", translation: "TRA",
  public_content: "PUB", faq: "FAQ", internal_trial: "TRL", corrective_action: "CRA",
  template_export: "TPL",
};

/** Content types whose published output can directly harm a garment or person. */
export const SAFETY_CRITICAL_TYPES: ContentType[] = [
  "stain_record", "fabric_compatibility_rule", "first_response", "treatment_principle",
  "product", "product_version", "product_mapping", "product_transition",
  "domestic_treatment", "household_product", "safety_rule", "treatment_pathway",
  "sds", "manufacturer_instruction", "kit_comparison", "product_ranking",
];

/* ------------------------------------------------------------------ */
/* 6. Content statuses                                                 */
/* ------------------------------------------------------------------ */

export const GOV_STATUSES = [
  "draft", "evidence_required", "technical_review", "safety_review", "country_review",
  "translation_review", "changes_requested", "approved", "scheduled", "published",
  "needs_review", "suspended", "rejected", "superseded", "archived",
] as const;
export type GovStatus = (typeof GOV_STATUSES)[number];

export const GOV_STATUS_LABEL: Record<GovStatus, string> = {
  draft: "Draft", evidence_required: "Evidence Required",
  technical_review: "Under Technical Review", safety_review: "Under Safety Review",
  country_review: "Under Country Review", translation_review: "Under Translation Review",
  changes_requested: "Changes Requested", approved: "Approved", scheduled: "Scheduled",
  published: "Published", needs_review: "Needs Review", suspended: "Suspended",
  rejected: "Rejected", superseded: "Superseded", archived: "Archived",
};

/** Only published content may drive live treatment guidance. */
export const LIVE_STATUSES: GovStatus[] = ["published"];
/** Approved-but-unpublished content is previewable by authorised users only. */
export const PREVIEWABLE_STATUSES: GovStatus[] = ["approved", "scheduled", "published"];

export const ALLOWED_TRANSITIONS: Record<GovStatus, GovStatus[]> = {
  draft: ["evidence_required", "technical_review", "rejected", "archived"],
  evidence_required: ["draft", "technical_review", "rejected", "archived"],
  technical_review: ["safety_review", "country_review", "translation_review", "changes_requested", "approved", "rejected", "suspended"],
  safety_review: ["country_review", "translation_review", "changes_requested", "approved", "rejected", "suspended"],
  country_review: ["translation_review", "changes_requested", "approved", "rejected", "suspended"],
  translation_review: ["changes_requested", "approved", "rejected", "suspended"],
  changes_requested: ["draft", "technical_review", "rejected", "archived"],
  approved: ["scheduled", "published", "changes_requested", "suspended", "archived"],
  scheduled: ["published", "approved", "suspended"],
  published: ["needs_review", "suspended", "superseded", "archived"],
  needs_review: ["technical_review", "safety_review", "suspended", "published", "archived"],
  suspended: ["technical_review", "safety_review", "archived", "published"],
  rejected: ["draft", "archived"],
  superseded: ["archived"],
  archived: [],
};

/* ------------------------------------------------------------------ */
/* 8. Governance roles and 9. reviewer scope                           */
/* ------------------------------------------------------------------ */

export const GOV_ROLES = [
  "content_author", "content_owner", "textile_technical_reviewer", "stain_chemistry_reviewer",
  "chemical_safety_reviewer", "product_documentation_reviewer", "country_reviewer",
  "translation_reviewer", "final_approver", "publisher", "system_administrator",
] as const;
export type GovRole = (typeof GOV_ROLES)[number];

export const GOV_ROLE_LABEL: Record<GovRole, string> = {
  content_author: "Content Author", content_owner: "Content Owner",
  textile_technical_reviewer: "Textile Technical Reviewer",
  stain_chemistry_reviewer: "Stain-Chemistry Reviewer",
  chemical_safety_reviewer: "Chemical-Safety Reviewer",
  product_documentation_reviewer: "Product-Documentation Reviewer",
  country_reviewer: "Country Reviewer", translation_reviewer: "Translation Reviewer",
  final_approver: "Final Approver", publisher: "Publisher",
  system_administrator: "System Administrator",
};

export const REVIEWER_SCOPES = [
  "stain_chemistry", "textile_fibres", "dye_colourfastness", "dry_cleaning", "wet_cleaning",
  "professional_laundry", "product_safety", "sds_review", "country_regulations",
  "domestic_treatment", "leather_suede", "coated_textiles", "training_content",
  "translation_language",
] as const;
export type ReviewerScope = (typeof REVIEWER_SCOPES)[number];

export const REVIEW_TYPES = ["technical", "safety", "country", "translation", "documentation"] as const;
export type ReviewType = (typeof REVIEW_TYPES)[number];

export const REVIEW_TYPE_LABEL: Record<ReviewType, string> = {
  technical: "Technical review", safety: "Chemical-safety review",
  country: "Country review", translation: "Translation review",
  documentation: "Product-documentation review",
};

/** Scopes that satisfy each review type. A reviewer must hold at least one. */
export const REVIEW_TYPE_SCOPES: Record<ReviewType, ReviewerScope[]> = {
  technical: ["stain_chemistry", "textile_fibres", "dye_colourfastness", "dry_cleaning",
    "wet_cleaning", "professional_laundry", "leather_suede", "coated_textiles", "domestic_treatment"],
  safety: ["product_safety", "sds_review"],
  country: ["country_regulations"],
  translation: ["translation_language"],
  documentation: ["sds_review", "product_safety", "professional_laundry"],
};

/** Roles permitted to perform each review type. */
export const REVIEW_TYPE_ROLES: Record<ReviewType, GovRole[]> = {
  technical: ["textile_technical_reviewer", "stain_chemistry_reviewer"],
  safety: ["chemical_safety_reviewer"],
  country: ["country_reviewer"],
  translation: ["translation_reviewer"],
  documentation: ["product_documentation_reviewer"],
};

export type Reviewer = {
  id: string;
  name: string;
  roles: GovRole[];
  scopes: ReviewerScope[];
  languages: string[];
  countries: string[];
  authorisationExpiry: string; // ISO date
  active: boolean;
};

export const REVIEW_DECISIONS = [
  "approve", "approve_with_notes", "changes_required", "reject",
  "suspend_pending_investigation", "refer_to_specialist",
] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export const REVIEW_DECISION_LABEL: Record<ReviewDecision, string> = {
  approve: "Approve", approve_with_notes: "Approve with Non-Critical Notes",
  changes_required: "Changes Required", reject: "Reject",
  suspend_pending_investigation: "Suspend Pending Investigation",
  refer_to_specialist: "Refer to Another Specialist",
};

/* ------------------------------------------------------------------ */
/* 11. Review checklists                                               */
/* ------------------------------------------------------------------ */

export const CHECKLISTS: Record<string, string[]> = {
  stain_entry: [
    "Classification is evidence-based.", "Fabric risks are addressed.",
    "Dye risks are addressed.", "Care restrictions are considered.",
    "Heat warning is correct.", "Ageing effect is addressed.",
    "Stop conditions exist.", "Expected outcome is realistic.",
    "Damage is distinguished from stain.", "Sources and version are recorded.",
  ],
  product_entry: [
    "Product identity verified.", "Manufacturer or distributor role verified.",
    "Country version confirmed.", "Current label reviewed.", "Current SDS reviewed.",
    "Current TDS reviewed.", "Fabric restrictions recorded.", "Colour restrictions recorded.",
    "Process restrictions recorded.", "PPE and ventilation recorded.",
    "Incompatibilities recorded.", "Rinsing or neutralization confirmed.",
    "Missing data not invented.",
  ],
  domestic_treatment: [
    "Confidence is at least 9/10.", "Fabric boundary is sufficiently established.",
    "Care instructions permit treatment.", "Household product is verified.",
    "Hidden-area test is defined.", "Maximum attempts are defined.",
    "Dangerous mixtures are prohibited.", "Stop conditions exist.",
    "Professional escalation exists.", "Evidence and country applicability are confirmed.",
  ],
  final_result: [
    "Exactly five advance recommendations appear.", "Fabric and dye risks are addressed.",
    "Product instructions are verified.", "No ratio or timing was invented.",
    "PPE and ventilation appear where required.",
    "Domestic and professional guidance are separated.", "Heat warning is clear.",
    "Stop conditions are present.", "Expected outcome is realistic.",
    "Source versions are recorded.",
  ],
};

export const CHECKLIST_FOR_TYPE: Partial<Record<ContentType, keyof typeof CHECKLISTS>> = {
  stain_record: "stain_entry", stain_classification: "stain_entry",
  product: "product_entry", product_version: "product_entry", product_mapping: "product_entry",
  domestic_treatment: "domestic_treatment", household_product: "domestic_treatment",
  treatment_pathway: "final_result", kit_comparison: "final_result",
};

/* ------------------------------------------------------------------ */
/* 5. Version numbering                                                */
/* ------------------------------------------------------------------ */

export const MAJOR_CHANGE_KINDS = [
  "treatment_sequence", "product_suitability", "fabric_prohibition", "safety_rule_material",
  "domestic_eligibility", "ppe_material", "chemical_incompatibility", "expected_outcome_material",
  "classification_treatment_relevant",
] as const;
export const MINOR_CHANGE_KINDS = [
  "wording_clarification", "non_critical_example", "formatting",
  "translation_no_meaning_change", "non_safety_metadata",
] as const;
export type ChangeKind = (typeof MAJOR_CHANGE_KINDS)[number] | (typeof MINOR_CHANGE_KINDS)[number];

export const CHANGE_KIND_LABEL: Record<ChangeKind, string> = {
  treatment_sequence: "Treatment sequence changed",
  product_suitability: "Product suitability changed",
  fabric_prohibition: "Fabric prohibition changed",
  safety_rule_material: "Safety rule changed materially",
  domestic_eligibility: "Domestic eligibility changed",
  ppe_material: "PPE changed materially",
  chemical_incompatibility: "Chemical incompatibility changed",
  expected_outcome_material: "Expected outcome changed materially",
  classification_treatment_relevant: "Classification changed in a treatment-relevant way",
  wording_clarification: "Clarifying wording",
  non_critical_example: "Non-critical example added",
  formatting: "Formatting improved",
  translation_no_meaning_change: "Translation corrected without changing meaning",
  non_safety_metadata: "Non-safety metadata updated",
};

/* ------------------------------------------------------------------ */
/* 13/16. Source documents and evidence                                */
/* ------------------------------------------------------------------ */

export const EVIDENCE_STATUSES = [
  "uploaded", "extraction_pending", "extracted", "under_review", "verified", "current",
  "country_mismatch", "version_conflict", "superseded", "expired_review", "incomplete",
  "rejected", "archived",
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const EVIDENCE_STATUS_LABEL: Record<EvidenceStatus, string> = {
  uploaded: "Uploaded", extraction_pending: "Extraction Pending", extracted: "Extracted",
  under_review: "Under Review", verified: "Verified", current: "Current",
  country_mismatch: "Country Mismatch", version_conflict: "Version Conflict",
  superseded: "Superseded", expired_review: "Expired Review", incomplete: "Incomplete",
  rejected: "Rejected", archived: "Archived",
};

/** Only these evidence statuses may support live treatment guidance. */
export const LIVE_EVIDENCE_STATUSES: EvidenceStatus[] = ["verified", "current"];

export const DOCUMENT_TYPES = [
  "product_label", "sds", "tds", "manufacturer_instruction", "spotting_chart",
  "equipment_manual", "textile_standard", "internal_trial", "credible_reference",
] as const;
export type GovDocumentType = (typeof DOCUMENT_TYPES)[number];

export type GovDocument = {
  documentId: string;
  documentType: GovDocumentType;
  issuer: string;
  relatedTo: string[];       // stable record IDs
  country: string;
  language: string;
  publicationDate: string;
  revisionDate?: string;
  documentVersion: string;   // manufacturer's own version, kept separate
  effectiveDate: string;
  reviewDate: string;
  fileHash: string;
  fileName?: string;
  sourceUrl?: string;
  status: EvidenceStatus;
  supersedes?: string;
  supersededBy?: string;
  reviewer?: string;
  claims: string[];
  accessNotes?: string;
};

/** 15. Claim-level traceability. */
export type EvidenceClaim = {
  claimId: string;
  recordId: string;
  claimText: string;
  documentId: string;
  section: string;
  documentVersion: string;
  safetyCritical: boolean;
};

export const CLAIM_EXAMPLES = [
  "Product prohibited on acetate", "Product requires eye protection",
  "Product incompatible with hydrocarbon process", "Heat may set a protein stain",
  "Domestic method suitable for washable cotton", "Maximum contact time",
  "Required neutralization", "Cost per treatment", "Product performance",
];

/* ------------------------------------------------------------------ */
/* 17/18. Review scheduling and triggers                               */
/* ------------------------------------------------------------------ */

export type RiskLevel = "green" | "amber" | "red" | "black";

/** Risk-based review intervals in days — configurable, never hard-coded per type. */
export const DEFAULT_REVIEW_INTERVAL_DAYS: Record<RiskLevel, number> = {
  green: 730, amber: 365, red: 180, black: 90,
};

export const SCHEDULE_KINDS = [
  "fixed_interval", "risk_based", "document_expiry", "product_change",
  "adverse_outcome", "country_change", "translation", "manual_request",
] as const;
export type ScheduleKind = (typeof SCHEDULE_KINDS)[number];

export const REVIEW_TRIGGERS = [
  "formulation_change", "label_change", "sds_change", "tds_change",
  "manufacturer_instruction_change", "product_discontinued", "replacement_product_added",
  "new_fabric_restriction", "new_dye_risk", "new_incompatibility", "safety_rule_change",
  "repeated_failures", "garment_damage_reported", "hazardous_reaction_reported",
  "ranking_evidence_change", "household_formulation_change", "translation_source_change",
  "country_applicability_change", "review_date_expired", "better_evidence_available",
] as const;
export type ReviewTrigger = (typeof REVIEW_TRIGGERS)[number];

export const REVIEW_TRIGGER_LABEL: Record<ReviewTrigger, string> = {
  formulation_change: "Product formulation changed", label_change: "Label changed",
  sds_change: "SDS changed", tds_change: "TDS changed",
  manufacturer_instruction_change: "Manufacturer instruction changed",
  product_discontinued: "Product discontinued",
  replacement_product_added: "Replacement product added",
  new_fabric_restriction: "New fabric restriction", new_dye_risk: "New dye risk",
  new_incompatibility: "New incompatibility", safety_rule_change: "Safety rule changed",
  repeated_failures: "Repeated treatment failures",
  garment_damage_reported: "Garment damage reported",
  hazardous_reaction_reported: "Hazardous reaction reported",
  ranking_evidence_change: "Ranking evidence changed",
  household_formulation_change: "Household product formulation changed",
  translation_source_change: "Translation source changed",
  country_applicability_change: "Country applicability changed",
  review_date_expired: "Review date expired",
  better_evidence_available: "Better technical evidence available",
};

/** Triggers that are safety-critical and therefore suspend live guidance. */
export const SUSPENDING_TRIGGERS: ReviewTrigger[] = [
  "sds_change", "formulation_change", "new_fabric_restriction", "new_incompatibility",
  "safety_rule_change", "hazardous_reaction_reported", "garment_damage_reported",
];

/* ------------------------------------------------------------------ */
/* 19. Dependency graph                                                */
/* ------------------------------------------------------------------ */

export type DependencyEdge = { from: ContentType; to: ContentType };

export const DEPENDENCY_EDGES: DependencyEdge[] = [
  { from: "sds", to: "product_version" },
  { from: "tds", to: "product_version" },
  { from: "product_label", to: "product_version" },
  { from: "manufacturer_instruction", to: "product_version" },
  { from: "product_version", to: "product_mapping" },
  { from: "product", to: "product_mapping" },
  { from: "product_mapping", to: "treatment_pathway" },
  { from: "treatment_pathway", to: "stain_record" },
  { from: "stain_record", to: "kit_comparison" },
  { from: "kit_comparison", to: "product_ranking" },
  { from: "product_ranking", to: "public_content" },
  { from: "stain_record", to: "public_content" },
  { from: "public_content", to: "training_content" },
  { from: "public_content", to: "translation" },
  { from: "safety_rule", to: "treatment_pathway" },
  { from: "safety_rule", to: "domestic_treatment" },
  { from: "domestic_treatment", to: "public_content" },
  { from: "household_product", to: "domestic_treatment" },
  { from: "fabric_compatibility_rule", to: "treatment_pathway" },
  { from: "stain_classification", to: "stain_record" },
  { from: "kit", to: "kit_comparison" },
  { from: "company", to: "product" },
  { from: "faq", to: "translation" },
  { from: "training_content", to: "translation" },
];

/* ------------------------------------------------------------------ */
/* 21. Change requests                                                 */
/* ------------------------------------------------------------------ */

export const CHANGE_REQUEST_CATEGORIES = [
  "incorrect_classification", "missing_fabric_restriction", "incorrect_product_instruction",
  "outdated_document", "translation_issue", "unsafe_advice", "treatment_failure",
  "garment_damage", "missing_stain", "missing_company_or_product", "search_issue",
  "accessibility_issue",
] as const;
export type ChangeRequestCategory = (typeof CHANGE_REQUEST_CATEGORIES)[number];

export const CHANGE_REQUEST_LABEL: Record<ChangeRequestCategory, string> = {
  incorrect_classification: "Incorrect stain classification",
  missing_fabric_restriction: "Missing fabric restriction",
  incorrect_product_instruction: "Incorrect product instruction",
  outdated_document: "Outdated document", translation_issue: "Translation issue",
  unsafe_advice: "Unsafe advice concern", treatment_failure: "Treatment failure",
  garment_damage: "Garment damage", missing_stain: "Missing stain",
  missing_company_or_product: "Missing company or product", search_issue: "Search issue",
  accessibility_issue: "Accessibility issue",
};

/** Categories that always open at high priority. */
export const HIGH_PRIORITY_CATEGORIES: ChangeRequestCategory[] = [
  "unsafe_advice", "garment_damage", "missing_fabric_restriction", "incorrect_product_instruction",
];

export type ChangeRequest = {
  requestId: string;
  category: ChangeRequestCategory;
  priority: "low" | "normal" | "high" | "critical";
  reporter: string;
  evidence: string;
  assignedOwner?: string;
  status: "open" | "triaged" | "in_progress" | "resolved" | "closed";
  resolution?: string;
  linkedRecordId?: string;
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/* 26. Translation governance                                          */
/* ------------------------------------------------------------------ */

export const TRANSLATION_STATUSES = [
  "not_started", "in_translation", "technical_review", "approved", "published",
  "outdated", "suspended",
] as const;
export type TranslationStatus = (typeof TRANSLATION_STATUSES)[number];

export const TRANSLATION_STATUS_LABEL: Record<TranslationStatus, string> = {
  not_started: "Not Started", in_translation: "In Translation",
  technical_review: "Technical Review", approved: "Approved", published: "Published",
  outdated: "Outdated", suspended: "Suspended",
};

export type TranslationRecord = {
  translationId: string;
  sourceRecordId: string;
  sourceVersion: string;
  language: string;
  country: string;
  translator: string;
  technicalReviewer?: string;
  status: TranslationStatus;
  reviewDate?: string;
  previousVersions: { version: string; status: TranslationStatus; at: string }[];
};

/* ------------------------------------------------------------------ */
/* 27. Country governance                                              */
/* ------------------------------------------------------------------ */

export const COUNTRY_CHECKS = [
  "formulation", "label", "sds", "tds", "regulatory_classification", "emergency_contact",
  "measurement_units", "language", "product_availability", "process_availability", "reviewer",
] as const;
export type CountryCheck = (typeof COUNTRY_CHECKS)[number];

export const COUNTRY_CHECK_LABEL: Record<CountryCheck, string> = {
  formulation: "Applicable product formulation", label: "Applicable label",
  sds: "Applicable SDS", tds: "Applicable TDS",
  regulatory_classification: "Regulatory classification",
  emergency_contact: "Emergency contact", measurement_units: "Measurement units",
  language: "Language", product_availability: "Product availability",
  process_availability: "Professional process availability", reviewer: "Country reviewer",
};

/* ------------------------------------------------------------------ */
/* 3/4. Governed record structures                                     */
/* ------------------------------------------------------------------ */

export type ApprovalSignature = {
  reviewerId: string;
  reviewerName: string;
  role: GovRole;
  scopes: ReviewerScope[];
  reviewType: ReviewType;
  decision: ReviewDecision;
  at: string;
  versionApproved: string;
  checklistCompleted: boolean;
  comments: string;
  authenticated: boolean;
};

/** Immutable, approved revision of a record. */
export type GovVersion = {
  version: string;              // "1.0", "1.1", "2.0"
  createdAt: string;
  approvedAt?: string;
  publishedAt?: string;
  withdrawnAt?: string;
  status: GovStatus;
  reasonForChange: string;
  revisionSummary: string;
  approvalNotes?: string;
  changeKinds: ChangeKind[];
  signatures: ApprovalSignature[];
  sourceDocumentIds: string[];
  payload: Record<string, unknown>;
  immutable: boolean;
};

export type GovRecord = {
  uuid: string;
  stableId: string;             // SM-STN-000001
  contentType: ContentType;
  title: string;
  currentVersion: string;
  status: GovStatus;
  owner?: string;
  author?: string;
  technicalReviewer?: string;
  safetyReviewer?: string;
  translationReviewer?: string;
  countryReviewer?: string;
  sourceDocumentIds: string[];
  countries: string[];
  language: string;
  riskLevel: RiskLevel;
  provisional: boolean;
  domesticConfidence?: number;      // for domestic treatments
  recommendationCount?: number;     // for result-bearing content
  createdAt: string;
  lastModifiedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  supersededAt?: string;
  suspendedAt?: string;
  archivedAt?: string;
  suspensionReason?: string;
  reasonForChange?: string;
  revisionSummary?: string;
  approvalNotes?: string;
  scheduleKind: ScheduleKind;
  reviewIntervalDays?: number;
  versions: GovVersion[];
  pendingChangeKinds: ChangeKind[];
  checklistState: Record<string, boolean>;
  notes?: string;
};

/** 4. Historical case snapshot — pinned to the exact version used. */
export type CaseSnapshot = {
  caseId: string;
  recordId: string;
  version: string;
  usedAt: string;
  payload: Record<string, unknown>;
};

/* ------------------------------------------------------------------ */
/* 24. Release management                                              */
/* ------------------------------------------------------------------ */

export const RELEASE_KINDS = ["content", "safety_rule", "migration", "translation", "ui"] as const;
export type ReleaseKind = (typeof RELEASE_KINDS)[number];

export type Release = {
  releaseId: string;
  name: string;
  version: string;
  kind: ReleaseKind;
  recordIds: string[];
  countries: string[];
  languages: string[];
  scheduledDate: string;
  owner: string;
  validationPassed: boolean;
  validationIssues: string[];
  approvedBy?: string;
  deployment: "pending" | "deployed" | "failed" | "rolled_back";
  rollbackPlan: string;
  notes: string;
};

/* ------------------------------------------------------------------ */
/* 25. Preview modes                                                   */
/* ------------------------------------------------------------------ */

export const PREVIEW_MODES = [
  "domestic", "quick_professional", "technical", "training", "public_website",
  "mobile", "country", "language", "permission",
] as const;
export type PreviewMode = (typeof PREVIEW_MODES)[number];

export const PREVIEW_MODE_LABEL: Record<PreviewMode, string> = {
  domestic: "Domestic Mode", quick_professional: "Quick Professional Mode",
  technical: "Technical Mode", training: "Training Mode",
  public_website: "Public website", mobile: "Mobile layout", country: "Different country",
  language: "Different language", permission: "Different user permission",
};

/* ------------------------------------------------------------------ */
/* 31. Notifications                                                   */
/* ------------------------------------------------------------------ */

export const NOTIFICATION_KINDS = [
  "review_assigned", "review_due_soon", "review_overdue", "changes_requested",
  "content_approved", "publication_scheduled", "content_published", "document_superseded",
  "safety_conflict", "adverse_outcome", "emergency_suspension", "translation_outdated",
  "release_failed", "rollback_completed",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const NOTIFICATION_LABEL: Record<NotificationKind, string> = {
  review_assigned: "Review assigned", review_due_soon: "Review due soon",
  review_overdue: "Review overdue", changes_requested: "Changes requested",
  content_approved: "Content approved", publication_scheduled: "Publication scheduled",
  content_published: "Content published", document_superseded: "Document superseded",
  safety_conflict: "Safety conflict", adverse_outcome: "Adverse outcome",
  emergency_suspension: "Emergency suspension", translation_outdated: "Translation outdated",
  release_failed: "Release failed", rollback_completed: "Rollback completed",
};

/** Critical safety notifications cannot be silently disabled. */
export const UNDISABLEABLE_NOTIFICATIONS: NotificationKind[] = [
  "safety_conflict", "adverse_outcome", "emergency_suspension", "document_superseded",
];

/* ------------------------------------------------------------------ */
/* 33. Archival and retention                                          */
/* ------------------------------------------------------------------ */

export const RETENTION_POLICY: { key: string; label: string; years: number | "permanent"; note: string }[] = [
  { key: "source_documents", label: "Source documents", years: 10, note: "Superseded documents retained, never deleted." },
  { key: "audit_records", label: "Audit records", years: "permanent", note: "Immutable to ordinary users." },
  { key: "adverse_outcomes", label: "Adverse outcomes", years: "permanent", note: "Safety-critical; archival only." },
  { key: "case_snapshots", label: "Case snapshots", years: 7, note: "Pinned to the version used." },
  { key: "photographs", label: "Photographs", years: 3, note: "Subject to consent and access control." },
  { key: "training_records", label: "Training records", years: 7, note: "Certification evidence." },
  { key: "prices", label: "Prices", years: 5, note: "Commercial record only." },
];

export const ARCHIVE_ONLY_TYPES: ContentType[] = [
  "product", "product_version", "safety_rule", "translation", "kit", "kit_comparison",
  "domestic_treatment", "sds", "tds", "product_label",
];

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

export type GovAudit = {
  id: string;
  at: string;
  user: string;
  role?: GovRole;
  action: string;
  recordId?: string;
  version?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  source?: string;
  organization?: string;
  country?: string;
  approvalImpact?: boolean;
  session?: string;
  immutable: true;
};

/* ------------------------------------------------------------------ */
/* 35. Governance audit findings                                       */
/* ------------------------------------------------------------------ */

export const AUDIT_FINDING_KINDS = [
  "missing_owner", "missing_reviewer", "missing_source", "missing_country",
  "missing_version", "missing_review_date", "provisional_data", "spotting_chart_only",
  "unverified_domestic", "unverified_company_relationship", "conflicting_instruction",
  "untranslated_safety_warning", "published_without_approval", "duplicate_record",
] as const;
export type AuditFindingKind = (typeof AUDIT_FINDING_KINDS)[number];

export const AUDIT_FINDING_LABEL: Record<AuditFindingKind, string> = {
  missing_owner: "Missing owner", missing_reviewer: "Missing reviewer",
  missing_source: "Missing source document", missing_country: "Missing country applicability",
  missing_version: "Missing version", missing_review_date: "Missing review date",
  provisional_data: "Provisional product data", spotting_chart_only: "Spotting-chart-only instruction",
  unverified_domestic: "Unverified domestic content",
  unverified_company_relationship: "Unverified company-relationship claim",
  conflicting_instruction: "Conflicting instruction",
  untranslated_safety_warning: "Untranslated safety warning",
  published_without_approval: "Published without approval",
  duplicate_record: "Duplicate stable ID or record",
};

export type AuditFinding = {
  kind: AuditFindingKind;
  recordId: string;
  detail: string;
  severity: "low" | "medium" | "high";
};

export type RemediationTask = {
  taskId: string;
  finding: AuditFindingKind;
  recordId: string;
  detail: string;
  assignedRole: GovRole;
  status: "open" | "in_progress" | "done";
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/* Seed reviewers                                                      */
/* ------------------------------------------------------------------ */

export const SEED_REVIEWERS: Reviewer[] = [
  {
    id: "rv-textile", name: "A. Textile Reviewer",
    roles: ["textile_technical_reviewer", "final_approver"],
    scopes: ["textile_fibres", "dye_colourfastness", "dry_cleaning", "wet_cleaning", "professional_laundry"],
    languages: ["en"], countries: ["IN", "GB"], authorisationExpiry: "2030-01-01", active: true,
  },
  {
    id: "rv-chem", name: "B. Stain Chemist",
    roles: ["stain_chemistry_reviewer"],
    scopes: ["stain_chemistry", "domestic_treatment"],
    languages: ["en"], countries: ["IN"], authorisationExpiry: "2030-01-01", active: true,
  },
  {
    id: "rv-safety", name: "C. Safety Reviewer",
    roles: ["chemical_safety_reviewer", "product_documentation_reviewer"],
    scopes: ["product_safety", "sds_review"],
    languages: ["en"], countries: ["IN", "DE"], authorisationExpiry: "2030-01-01", active: true,
  },
  {
    id: "rv-country", name: "D. Country Reviewer",
    roles: ["country_reviewer"], scopes: ["country_regulations"],
    languages: ["en", "hi"], countries: ["IN"], authorisationExpiry: "2030-01-01", active: true,
  },
  {
    id: "rv-trans", name: "E. Translation Reviewer",
    roles: ["translation_reviewer"], scopes: ["translation_language"],
    languages: ["hi"], countries: ["IN"], authorisationExpiry: "2030-01-01", active: true,
  },
  {
    id: "rv-admin", name: "F. System Administrator",
    roles: ["system_administrator", "publisher"], scopes: [],
    languages: ["en"], countries: ["IN"], authorisationExpiry: "2030-01-01", active: true,
  },
  {
    id: "rv-expired", name: "G. Lapsed Reviewer",
    roles: ["textile_technical_reviewer"], scopes: ["textile_fibres"],
    languages: ["en"], countries: ["IN"], authorisationExpiry: "2020-01-01", active: true,
  },
];

/* ------------------------------------------------------------------ */
/* Seed documents                                                      */
/* ------------------------------------------------------------------ */

export const SEED_DOCUMENTS: GovDocument[] = [
  {
    documentId: "SM-DOC-000001", documentType: "sds", issuer: "Seitz",
    relatedTo: ["SM-PRD-000001"], country: "IN", language: "en",
    publicationDate: "2024-02-01", documentVersion: "3.1", effectiveDate: "2024-02-01",
    reviewDate: "2027-02-01", fileHash: "sha256:seed-sds-seitz-3-1",
    status: "current", claims: ["Product requires eye protection", "Required neutralization"],
    reviewer: "rv-safety",
  },
  {
    documentId: "SM-DOC-000002", documentType: "tds", issuer: "STAS",
    relatedTo: ["SM-PRD-000002"], country: "IN", language: "en",
    publicationDate: "2023-06-15", documentVersion: "2.0", effectiveDate: "2023-06-15",
    reviewDate: "2026-06-15", fileHash: "sha256:seed-tds-stas-2-0",
    status: "current", claims: ["Maximum contact time", "Product prohibited on acetate"],
    reviewer: "rv-safety",
  },
  {
    documentId: "SM-DOC-000003", documentType: "spotting_chart", issuer: "Clean Craft",
    relatedTo: ["SM-PRD-000003"], country: "IN", language: "en",
    publicationDate: "2022-01-10", documentVersion: "1.0", effectiveDate: "2022-01-10",
    reviewDate: "2025-01-10", fileHash: "sha256:seed-chart-cc-1-0",
    status: "incomplete", claims: ["Product performance"],
  },
];

export const GOVERNANCE_PRINCIPLE =
  "No safety-critical instruction should exist without an owner, evidence, reviewer, version and review date.";
