/**
 * STEP 16 — Administration workspace vocabulary.
 *
 * Permanent principle:
 *   Administration should make correct maintenance easy and unsafe publication difficult.
 *
 * This file only DESCRIBES the administration area: modes, navigation sections,
 * the consolidation map from earlier fragmented admin tools, status presentation,
 * high-impact actions, error catalogue and initial (seed) operational data.
 * No approval, safety, version or role control is redefined here — those stay in
 * governanceEngine / safetyEngine / domesticEngine / comparisonEngine.
 */

import type { GovRole, GovStatus } from "@/data/governance";

export const ADMIN_AREA_VERSION = "step16-admin-v1";

export const ADMIN_PRINCIPLE =
  "Administration should make correct maintenance easy and unsafe publication difficult.";

/* ------------------------------------------------------------------ */
/* 2. Administration modes                                             */
/* ------------------------------------------------------------------ */

export const ADMIN_MODES = [
  "content",
  "technical_review",
  "safety_review",
  "translation_country",
  "organization",
  "system",
] as const;
export type AdminMode = (typeof ADMIN_MODES)[number];

export const ADMIN_MODE_LABEL: Record<AdminMode, string> = {
  content: "Content Administration",
  technical_review: "Technical Review",
  safety_review: "Safety Review",
  translation_country: "Translation & Country Review",
  organization: "Organization Administration",
  system: "System Administration",
};

export const ADMIN_MODE_HINT: Record<AdminMode, string> = {
  content: "Authors and content owners — drafting, evidence, submission.",
  technical_review: "Textile, stain-chemistry and product reviewers.",
  safety_review: "Chemical-safety reviewers — rules, PPE, incompatibilities.",
  translation_country: "Localization and country applicability specialists.",
  organization: "Organization users, staff, inventory and training.",
  system: "Platform configuration, access, monitoring and releases.",
};

/** Which governance roles may enter each mode. Administrators are NOT reviewers. */
export const MODE_ROLES: Record<AdminMode, GovRole[]> = {
  content: ["content_author", "content_owner", "system_administrator"],
  technical_review: ["textile_technical_reviewer", "stain_chemistry_reviewer", "product_documentation_reviewer"],
  safety_review: ["chemical_safety_reviewer"],
  translation_country: ["translation_reviewer", "country_reviewer"],
  organization: ["content_owner", "system_administrator"],
  system: ["system_administrator", "publisher"],
};

/* ------------------------------------------------------------------ */
/* 3. Main administration navigation                                   */
/* ------------------------------------------------------------------ */

export const ADMIN_SECTIONS = [
  "dashboard", "stains", "taxonomy", "fabrics", "companies", "kits", "products",
  "documents", "mappings", "pathways", "domestic", "comparisons", "safety_rules",
  "outcomes", "training", "translations", "countries", "reviews", "releases",
  "organizations", "users", "inventory", "import_export", "audit", "system_health",
] as const;
export type AdminSection = (typeof ADMIN_SECTIONS)[number];

export type AdminSectionMeta = {
  key: AdminSection;
  label: string;
  description: string;
  /** Existing route this section consolidates (reuse, never duplicate). */
  route: string;
  /** Earlier fragmented tools folded into this section. */
  consolidates: string[];
  modes: AdminMode[];
  /** Primary navigation vs the mobile "More" group. */
  primary: boolean;
};

export const ADMIN_SECTION_META: Record<AdminSection, AdminSectionMeta> = {
  dashboard: {
    key: "dashboard", label: "Dashboard", description: "Actionable work queues across the knowledge system.",
    route: "/admin", consolidates: ["/admin (legacy course dashboard)"], modes: [...ADMIN_MODES], primary: true,
  },
  stains: {
    key: "stains", label: "Stains", description: "Master stain records, aliases, variants and public content.",
    route: "/admin/stain-database",
    consolidates: ["/admin/stain-database", "/admin/stain-id", "/admin (Stain Library tab)"],
    modes: ["content", "technical_review"], primary: true,
  },
  taxonomy: {
    key: "taxonomy", label: "Taxonomy", description: "Twelve primary categories, components, source types and tags.",
    route: "/admin/classification", consolidates: ["/admin/classification"],
    modes: ["content", "technical_review"], primary: false,
  },
  fabrics: {
    key: "fabrics", label: "Fabrics", description: "Fabric families, sensitivities and garment-risk groups.",
    route: "/admin/fabric-check", consolidates: ["/admin/fabric-check", "/admin/foundation"],
    modes: ["content", "technical_review"], primary: true,
  },
  companies: {
    key: "companies", label: "Companies", description: "Manufacturers, distributors and verified relationships.",
    route: "/admin/products?view=companies", consolidates: ["/admin/products (company tab)"],
    modes: ["content", "technical_review"], primary: true,
  },
  kits: {
    key: "kits", label: "Kits", description: "Kit editions, pack configuration and verified product membership.",
    route: "/admin/products?view=kits", consolidates: ["/admin/products (kit tab)"],
    modes: ["content", "technical_review"], primary: true,
  },
  products: {
    key: "products", label: "Products", description: "Products, versions, country formulations and verification.",
    route: "/admin/products", consolidates: ["/admin/products"],
    modes: ["content", "technical_review", "safety_review"], primary: true,
  },
  documents: {
    key: "documents", label: "Documents", description: "Labels, SDSs, TDSs, charts and controlled trials.",
    route: "/admin/documents", consolidates: ["evidence panes in product, stain and governance tools"],
    modes: ["content", "technical_review", "safety_review"], primary: true,
  },
  mappings: {
    key: "mappings", label: "Product Mappings", description: "Verified product-version to treatment-stage mappings.",
    route: "/admin/mapping-matrix", consolidates: ["/admin/mapping-matrix", "/admin/mapping-editor"],
    modes: ["content", "technical_review", "safety_review"], primary: true,
  },
  pathways: {
    key: "pathways", label: "Treatment Pathways", description: "Ordered stages, gates, heat locks and escalation.",
    route: "/treatment-stages", consolidates: ["/treatment-stages"],
    modes: ["content", "technical_review"], primary: false,
  },
  domestic: {
    key: "domestic", label: "Domestic Treatments", description: "Household methods, eligibility and 9/10 confidence gate.",
    route: "/admin/domestic", consolidates: ["/admin/domestic"],
    modes: ["content", "technical_review", "safety_review"], primary: true,
  },
  comparisons: {
    key: "comparisons", label: "Comparisons", description: "Three-kit comparisons, comparability gates and ranking.",
    route: "/admin/comparison", consolidates: ["/admin/comparison"],
    modes: ["content", "technical_review"], primary: false,
  },
  safety_rules: {
    key: "safety_rules", label: "Safety Rules", description: "Centralized rule set, simulator, activation and rollback.",
    route: "/admin/safety", consolidates: ["/admin/safety", "/admin/readiness"],
    modes: ["safety_review", "system"], primary: true,
  },
  outcomes: {
    key: "outcomes", label: "Outcomes", description: "Treatment results, adverse outcomes and investigations.",
    route: "/admin/outcome-analytics", consolidates: ["/admin/outcome-analytics", "/admin/outcome-review"],
    modes: ["content", "technical_review", "safety_review"], primary: true,
  },
  training: {
    key: "training", label: "Training", description: "Modules, competencies, trainers, learners and expiry.",
    route: "/admin/training", consolidates: ["/admin (upload + vault tabs)"],
    modes: ["content", "organization"], primary: false,
  },
  translations: {
    key: "translations", label: "Translations", description: "Localized content, glossary and outdated-source warnings.",
    route: "/admin/translations", consolidates: ["governance translation queue"],
    modes: ["translation_country"], primary: false,
  },
  countries: {
    key: "countries", label: "Countries", description: "Languages, units, availability and regulatory notes.",
    route: "/admin/countries", consolidates: ["governance country checklist"],
    modes: ["translation_country", "system"], primary: false,
  },
  reviews: {
    key: "reviews", label: "Reviews", description: "Reviewer queue, side-by-side comparison and decisions.",
    route: "/admin/governance", consolidates: ["/admin/governance (queues)", "/admin/outcome-review"],
    modes: ["technical_review", "safety_review", "translation_country"], primary: true,
  },
  releases: {
    key: "releases", label: "Releases", description: "Release scope, validation, deployment and rollback.",
    route: "/admin/governance?tab=releases", consolidates: ["/admin/governance (release tab)"],
    modes: ["system"], primary: false,
  },
  organizations: {
    key: "organizations", label: "Organizations", description: "Sites, staff, equipment, processes and settings.",
    route: "/admin/organizations", consolidates: [],
    modes: ["organization", "system"], primary: false,
  },
  users: {
    key: "users", label: "Users", description: "Roles, mode access, competency, suspension and access history.",
    route: "/admin/users", consolidates: ["/admin (students tab)"],
    modes: ["system", "organization"], primary: true,
  },
  inventory: {
    key: "inventory", label: "Inventory", description: "Organization stock, batches, expiry and local prices.",
    route: "/admin/organizations?tab=inventory", consolidates: [],
    modes: ["organization"], primary: false,
  },
  import_export: {
    key: "import_export", label: "Import / Export", description: "Controlled bulk import (drafts only) and scoped export.",
    route: "/admin/import-export", consolidates: ["/admin (bulk upload tab)"],
    modes: ["content", "system"], primary: false,
  },
  audit: {
    key: "audit", label: "Audit", description: "Immutable, searchable governance and administration history.",
    route: "/admin/audit", consolidates: ["/admin/governance (log tab)"],
    modes: ["system", "technical_review", "safety_review"], primary: false,
  },
  system_health: {
    key: "system_health", label: "System Health", description: "Service status, jobs, validation and release versions.",
    route: "/admin/system-health", consolidates: [],
    modes: ["system"], primary: false,
  },
};

export const PRIMARY_SECTIONS = ADMIN_SECTIONS.filter((s) => ADMIN_SECTION_META[s].primary);
export const MORE_SECTIONS = ADMIN_SECTIONS.filter((s) => !ADMIN_SECTION_META[s].primary);

/** Duplicate tools retired by this step (route kept, entry point consolidated). */
export const RETIRED_ENTRY_POINTS: { route: string; replacedBy: AdminSection; note: string }[] = [
  { route: "/admin (legacy tabs)", replacedBy: "dashboard", note: "Course-era dashboard is now one workspace tab set." },
  { route: "/admin/mapping-editor", replacedBy: "mappings", note: "Reached from the mapping matrix, not a separate menu." },
  { route: "/admin/outcome-review", replacedBy: "reviews", note: "Outcome review joins the single reviewer queue." },
  { route: "/admin/readiness", replacedBy: "safety_rules", note: "Readiness thresholds live with the safety rule set." },
  { route: "/admin/foundation", replacedBy: "fabrics", note: "Foundation check is a fabric-data diagnostic." },
  { route: "/admin/stain-id", replacedBy: "stains", note: "Identification tuning is part of stain administration." },
];

/* ------------------------------------------------------------------ */
/* 7. Status visibility (never colour alone)                           */
/* ------------------------------------------------------------------ */

export type StatusPresentation = { label: string; icon: string; tone: string; blocksLive: boolean };

export const STATUS_PRESENTATION: Record<GovStatus, StatusPresentation> = {
  draft: { label: "Draft", icon: "pencil", tone: "muted", blocksLive: true },
  evidence_required: { label: "Evidence Required", icon: "file-search", tone: "amber", blocksLive: true },
  technical_review: { label: "Under Technical Review", icon: "eye", tone: "blue", blocksLive: true },
  safety_review: { label: "Under Safety Review", icon: "shield", tone: "blue", blocksLive: true },
  country_review: { label: "Under Country Review", icon: "map", tone: "blue", blocksLive: true },
  translation_review: { label: "Under Translation Review", icon: "languages", tone: "blue", blocksLive: true },
  changes_requested: { label: "Changes Requested", icon: "rotate-ccw", tone: "amber", blocksLive: true },
  approved: { label: "Approved", icon: "check", tone: "green", blocksLive: true },
  scheduled: { label: "Scheduled", icon: "clock", tone: "blue", blocksLive: true },
  published: { label: "Published", icon: "globe", tone: "green", blocksLive: false },
  needs_review: { label: "Needs Review", icon: "alert-circle", tone: "amber", blocksLive: false },
  suspended: { label: "Suspended", icon: "pause", tone: "red", blocksLive: true },
  rejected: { label: "Rejected", icon: "x", tone: "red", blocksLive: true },
  superseded: { label: "Superseded", icon: "layers", tone: "muted", blocksLive: true },
  archived: { label: "Archived", icon: "archive", tone: "muted", blocksLive: true },

};

/* ------------------------------------------------------------------ */
/* 6. Consistent record interface                                      */
/* ------------------------------------------------------------------ */

export const RECORD_TABS = [
  "overview", "structured_data", "rules", "documents", "review", "versions", "dependencies", "audit",
] as const;
export type RecordTab = (typeof RECORD_TABS)[number];

export const RECORD_TAB_LABEL: Record<RecordTab, string> = {
  overview: "Overview", structured_data: "Structured Data", rules: "Compatibility / Rules",
  documents: "Documents & Evidence", review: "Review", versions: "Versions",
  dependencies: "Dependencies", audit: "Audit",
};

export const RECORD_ACTIONS = [
  "edit_draft", "add_evidence", "submit_for_review", "request_changes", "approve",
  "schedule", "publish", "suspend", "new_version", "archive", "export",
] as const;
export type RecordAction = (typeof RECORD_ACTIONS)[number];

export const RECORD_ACTION_LABEL: Record<RecordAction, string> = {
  edit_draft: "Edit Draft", add_evidence: "Add Evidence", submit_for_review: "Submit for Review",
  request_changes: "Request Changes", approve: "Approve", schedule: "Schedule", publish: "Publish",
  suspend: "Suspend", new_version: "Create New Version", archive: "Archive", export: "Export",
};

/* ------------------------------------------------------------------ */
/* 38. High-impact actions — confirmation + written reason             */
/* ------------------------------------------------------------------ */

export const HIGH_IMPACT_ACTIONS = [
  "suspend_guidance", "reject_content", "archive_content", "change_manufacturer",
  "change_product_chemistry", "change_prohibited_fabric", "change_ppe",
  "change_incompatibility", "change_domestic_eligibility", "override_safety_decision",
  "approve_final_rank", "activate_safety_rules", "publish_release", "rollback_release",
  "suspend_user",
] as const;
export type HighImpactAction = (typeof HIGH_IMPACT_ACTIONS)[number];

export const HIGH_IMPACT_LABEL: Record<HighImpactAction, string> = {
  suspend_guidance: "Suspend guidance", reject_content: "Reject content",
  archive_content: "Archive content", change_manufacturer: "Change manufacturer",
  change_product_chemistry: "Change product chemistry",
  change_prohibited_fabric: "Change prohibited fabric", change_ppe: "Change PPE",
  change_incompatibility: "Change incompatibility",
  change_domestic_eligibility: "Change domestic eligibility",
  override_safety_decision: "Override safety decision", approve_final_rank: "Approve final rank",
  activate_safety_rules: "Activate safety rules", publish_release: "Publish release",
  rollback_release: "Roll back release", suspend_user: "Suspend user",
};

export const MIN_REASON_LENGTH = 12;

/* ------------------------------------------------------------------ */
/* 35. Safe error states                                               */
/* ------------------------------------------------------------------ */

export const ADMIN_ERRORS = {
  save_failed: "Record could not be saved. Your changes are kept locally — retry when connection returns.",
  version_conflict: "Version conflict detected. Another editor saved a newer version; compare before overwriting.",
  document_missing: "Required document missing. Attach the label, SDS or TDS before submitting.",
  reviewer_permission: "Reviewer permission missing. This review type is outside your authorised scope.",
  publication_validation: "Publication validation failed. Resolve the listed issues before publishing.",
  dependency_suspended: "Dependency suspended. A record this depends on is not safe to publish.",
  country_mismatch: "Country mismatch. Evidence does not cover the countries claimed by this record.",
  translation_outdated: "Translation outdated. The source version changed after this translation was approved.",
  safety_engine_unavailable: "Safety engine unavailable. Publication and live treatment guidance are blocked.",
  import_errors: "Import contains errors. Correct the highlighted rows — nothing has been imported yet.",
  release_failed: "Release failed safely. No record was partly published.",
} as const;
export type AdminErrorKey = keyof typeof ADMIN_ERRORS;

/* ------------------------------------------------------------------ */
/* 27. Users, competency, access                                       */
/* ------------------------------------------------------------------ */

export const USER_STATUSES = ["invited", "active", "suspended", "deactivated"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export type AdminUser = {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  roles: GovRole[];
  modes: AdminMode[];
  organizationId?: string;
  country: string;
  language: string;
  status: UserStatus;
  competencies: { name: string; expiresAt: string }[];
  trainingCompleted: string[];
  lastAccessAt?: string;
  accessHistory: { at: string; action: string; allowed: boolean }[];
};

/** Permissions that a competency underwrites; expiry removes them. */
export const COMPETENCY_PERMISSIONS: Record<string, AdminSection[]> = {
  "Professional spotting": ["mappings", "pathways"],
  "Chemical safety": ["safety_rules"],
  "Product documentation": ["documents", "products"],
};

/* ------------------------------------------------------------------ */
/* 28-29. Organizations and inventory                                  */
/* ------------------------------------------------------------------ */

export type AdminOrganization = {
  organizationId: string;
  name: string;
  country: string;
  locations: string[];
  processes: string[];
  ppeAvailable: string[];
  equipment: string[];
  settings: { allowDomesticGuidance: boolean; requireSupervisorForRed: boolean };
};

export type InventoryItem = {
  itemId: string;
  organizationId: string;
  productId: string;
  productVersion: string;
  packSize: string;
  batch?: string;
  quantity: number;
  expiry?: string;
  dateOpened?: string;
  storageLocation?: string;
  localPrice?: number;
  approvedForUse: boolean;
  documentsAvailable: string[];
  staffPermitted: string[];
};

/* ------------------------------------------------------------------ */
/* 26. Training                                                        */
/* ------------------------------------------------------------------ */

export type TrainingModule = {
  moduleId: string;
  title: string;
  competency: string;
  productFamilies: string[];
  equipment: string[];
  countries: string[];
  knowledgeVersionRef: string;   // must reference an approved knowledge version
  trainer: string;
  expiryMonths: number;
  status: GovStatus;
};

/* ------------------------------------------------------------------ */
/* 25. Countries                                                       */
/* ------------------------------------------------------------------ */

export type CountryConfig = {
  code: string;
  name: string;
  languages: string[];
  units: "metric" | "imperial";
  emergencyInfo: string;
  regulatoryNotes: string;
  countryReviewers: string[];
  domesticProductsAvailable: string[];
  status: "active" | "draft";
};

/* ------------------------------------------------------------------ */
/* 30-31. Bulk import / export                                         */
/* ------------------------------------------------------------------ */

export const IMPORT_KINDS = [
  "stains", "aliases", "companies", "kits", "products", "pack_sizes",
  "document_metadata", "prices", "translations", "test_outcomes",
] as const;
export type ImportKind = (typeof IMPORT_KINDS)[number];

export const IMPORT_TEMPLATES: Record<ImportKind, string[]> = {
  stains: ["canonical_name", "category", "country", "language"],
  aliases: ["stain_id", "alias", "language"],
  companies: ["legal_name", "country", "role"],
  kits: ["company", "kit_name", "edition", "country"],
  products: ["company", "product_name", "product_code", "country"],
  pack_sizes: ["product_code", "pack_size", "unit"],
  document_metadata: ["document_type", "issuer", "product_code", "country", "language", "version"],
  prices: ["product_code", "country", "currency", "price"],
  translations: ["record_id", "language", "translated_title"],
  test_outcomes: ["record_id", "fabric", "result", "date"],
};

export const EXPORT_KINDS = [
  "stain_database", "product_database", "document_register", "mapping_matrix",
  "domestic_treatments", "comparison_data", "review_status", "outcomes", "audit_report",
] as const;
export type ExportKind = (typeof EXPORT_KINDS)[number];

/** Roles allowed to export each dataset. */
export const EXPORT_ROLES: Record<ExportKind, GovRole[]> = {
  stain_database: ["content_owner", "system_administrator", "textile_technical_reviewer"],
  product_database: ["content_owner", "system_administrator", "product_documentation_reviewer"],
  document_register: ["content_owner", "system_administrator", "product_documentation_reviewer"],
  mapping_matrix: ["content_owner", "system_administrator", "textile_technical_reviewer"],
  domestic_treatments: ["content_owner", "system_administrator", "chemical_safety_reviewer"],
  comparison_data: ["content_owner", "system_administrator"],
  review_status: ["content_owner", "system_administrator"],
  outcomes: ["content_owner", "system_administrator", "chemical_safety_reviewer"],
  audit_report: ["system_administrator"],
};

/** Columns that must never leave the platform in an export. */
export const PRIVATE_EXPORT_FIELDS = [
  "customerName", "customerPhone", "customerEmail", "customerAddress", "reviewerEmail",
];

/* ------------------------------------------------------------------ */
/* 34. System health                                                   */
/* ------------------------------------------------------------------ */

export const HEALTH_CHECKS = [
  "database", "storage", "search", "safety_engine", "authentication", "background_jobs",
  "document_extraction", "translation_jobs", "notifications", "failed_validations",
  "failed_migrations", "unsynced_offline", "last_backup",
] as const;
export type HealthCheck = (typeof HEALTH_CHECKS)[number];

export const HEALTH_LABEL: Record<HealthCheck, string> = {
  database: "Database", storage: "Storage", search: "Search", safety_engine: "Safety engine",
  authentication: "Authentication", background_jobs: "Background jobs",
  document_extraction: "Document extraction", translation_jobs: "Translation jobs",
  notifications: "Notification service", failed_validations: "Failed validations",
  failed_migrations: "Failed migrations", unsynced_offline: "Unsynced offline records",
  last_backup: "Last backup",
};

/* ------------------------------------------------------------------ */
/* 40. Initial administration setup                                    */
/* ------------------------------------------------------------------ */

export const SEED_ADMIN_USERS: AdminUser[] = [
  {
    userId: "usr-owner", name: "Content Owner", email: "owner@stainmaster.in",
    roles: ["content_owner", "content_author"], modes: ["content", "organization"],
    country: "IN", language: "en", status: "active",
    competencies: [{ name: "Product documentation", expiresAt: "2028-01-01" }],
    trainingCompleted: ["mod-foundation"], accessHistory: [],
  },
  {
    userId: "usr-textile", name: "Textile Reviewer", email: "textile@stainmaster.in",
    roles: ["textile_technical_reviewer"], modes: ["technical_review"],
    country: "IN", language: "en", status: "active",
    competencies: [{ name: "Professional spotting", expiresAt: "2027-06-30" }],
    trainingCompleted: ["mod-fabric"], accessHistory: [],
  },
  {
    userId: "usr-safety", name: "Safety Reviewer", email: "safety@stainmaster.in",
    roles: ["chemical_safety_reviewer"], modes: ["safety_review"],
    country: "IN", language: "en", status: "active",
    competencies: [{ name: "Chemical safety", expiresAt: "2027-12-31" }],
    trainingCompleted: ["mod-safety"], accessHistory: [],
  },
  {
    userId: "usr-sysadmin", name: "System Administrator", email: "admin@gilm.in",
    roles: ["system_administrator", "publisher"], modes: ["system", "content", "organization"],
    country: "IN", language: "en", status: "active",
    competencies: [], trainingCompleted: [], accessHistory: [],
  },
  {
    userId: "usr-orgA-staff", name: "Anita (Org A)", email: "anita@orga.in",
    roles: ["content_author"], modes: ["organization"], organizationId: "org-a",
    country: "IN", language: "en", status: "active",
    competencies: [{ name: "Professional spotting", expiresAt: "2024-01-01" }],
    trainingCompleted: [], accessHistory: [],
  },
  {
    userId: "usr-orgB-staff", name: "Rahul (Org B)", email: "rahul@orgb.in",
    roles: ["content_author"], modes: ["organization"], organizationId: "org-b",
    country: "IN", language: "en", status: "active",
    competencies: [], trainingCompleted: [], accessHistory: [],
  },
];

export const SEED_ORGANIZATIONS: AdminOrganization[] = [
  {
    organizationId: "org-a", name: "Sparkle Dry Clean (Delhi)", country: "IN",
    locations: ["Delhi — Rajouri Garden"], processes: ["dry_cleaning", "wet_cleaning"],
    ppeAvailable: ["nitrile gloves", "goggles", "apron"], equipment: ["spotting board", "steam gun"],
    settings: { allowDomesticGuidance: false, requireSupervisorForRed: true },
  },
  {
    organizationId: "org-b", name: "Fresh Laundry Co (Pune)", country: "IN",
    locations: ["Pune — Kothrud"], processes: ["professional_laundry"],
    ppeAvailable: ["nitrile gloves"], equipment: ["washer extractor"],
    settings: { allowDomesticGuidance: true, requireSupervisorForRed: true },
  },
];

export const SEED_INVENTORY: InventoryItem[] = [
  {
    itemId: "inv-a-1", organizationId: "org-a", productId: "SM-PRD-000001", productVersion: "v1.0",
    packSize: "500 ml", batch: "B-2291", quantity: 3, expiry: "2027-03-01",
    storageLocation: "Spotting bench", localPrice: 950, approvedForUse: true,
    documentsAvailable: ["SM-DOC-000002"], staffPermitted: ["usr-orgA-staff"],
  },
  {
    itemId: "inv-b-1", organizationId: "org-b", productId: "SM-PRD-000002", productVersion: "v0.1",
    packSize: "1 L", quantity: 1, approvedForUse: false,
    documentsAvailable: [], staffPermitted: ["usr-orgB-staff"],
  },
];

export const SEED_TRAINING: TrainingModule[] = [
  {
    moduleId: "mod-foundation", title: "Stain Master foundations", competency: "Product documentation",
    productFamilies: [], equipment: [], countries: ["IN"], knowledgeVersionRef: "SM-STN-000001@v1.0",
    trainer: "usr-owner", expiryMonths: 24, status: "published",
  },
  {
    moduleId: "mod-fabric", title: "Fabric risk and no-label garments", competency: "Professional spotting",
    productFamilies: [], equipment: ["spotting board"], countries: ["IN"],
    knowledgeVersionRef: "SM-FAB-000001@v1.0", trainer: "usr-textile", expiryMonths: 24, status: "published",
  },
  {
    moduleId: "mod-safety", title: "Chemical safety and PPE", competency: "Chemical safety",
    productFamilies: ["solvent"], equipment: [], countries: ["IN"],
    knowledgeVersionRef: "SM-RUL-000001@v1.0", trainer: "usr-safety", expiryMonths: 12, status: "published",
  },
];

export const SEED_COUNTRIES: CountryConfig[] = [
  {
    code: "IN", name: "India", languages: ["en", "hi"], units: "metric",
    emergencyInfo: "Call 112. Poison control: local hospital emergency.",
    regulatoryNotes: "SDS in English accepted; Hindi safety summary recommended.",
    countryReviewers: ["usr-owner"], domesticProductsAvailable: ["HP-DISH-001", "HP-BAKING-001"],
    status: "active",
  },
  {
    code: "AE", name: "United Arab Emirates", languages: ["en", "ar"], units: "metric",
    emergencyInfo: "Call 998 (ambulance).", regulatoryNotes: "Country review pending.",
    countryReviewers: [], domesticProductsAvailable: [], status: "draft",
  },
];

/** 40. Provisional company/kit setup tasks that must stay visible. */
export type SetupTask = {
  taskId: string;
  title: string;
  company: "Seitz" | "STAS" | "Clean Craft";
  kind: "missing_document" | "inconsistency" | "verification";
  detail: string;
  assignedRole: GovRole;
  open: boolean;
};

export const SEED_SETUP_TASKS: SetupTask[] = [
  {
    taskId: "task-seitz-docs", title: "Seitz product-document verification", company: "Seitz",
    kind: "verification", detail: "Seven-bottle kit: obtain label, SDS and TDS for each product version.",
    assignedRole: "product_documentation_reviewer", open: true,
  },
  {
    taskId: "task-stas-docs", title: "STAS missing SDS and TDS", company: "STAS",
    kind: "missing_document", detail: "Stain N Kit: spotting chart supplied, SDS/TDS not received.",
    assignedRole: "product_documentation_reviewer", open: true,
  },
  {
    taskId: "task-cc-count", title: "Clean Craft nine-bottle kit count unverified", company: "Clean Craft",
    kind: "verification", detail: "Claimed nine products; only provisional identities documented.",
    assignedRole: "product_documentation_reviewer", open: true,
  },
  {
    taskId: "task-cc-fungus", title: "Fungus Go inconsistency", company: "Clean Craft",
    kind: "inconsistency", detail: "Chart and label describe different application steps for Fungus Go.",
    assignedRole: "stain_chemistry_reviewer", open: true,
  },
  {
    taskId: "task-cc-steam", title: "Clean Craft steam-on-protein review", company: "Clean Craft",
    kind: "inconsistency", detail: "Chart suggests steam on protein stains; conflicts with heat-set rule.",
    assignedRole: "chemical_safety_reviewer", open: true,
  },
];
