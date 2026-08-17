/**
 * STEP 7 — Professional product database.
 *
 * Permanent principle:
 *   A product is not a treatment recommendation until its intended use, textile
 *   compatibility, process, safety documents and evidence have been verified.
 *
 * Nothing in this file may invent chemistry, dilution, contact time, temperature,
 * attempt limits, PPE or neutralisation. Undocumented values are omitted, never
 * guessed, and are rendered as "Not disclosed" / "Insufficient Information".
 */

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const NOT_DISCLOSED = "Not disclosed";
export const INSUFFICIENT_INFO = "Insufficient Information";
export const FOLLOW_LABEL = "Follow the current product label or technical data sheet.";
export const COST_UNAVAILABLE = "Cost per treatment cannot be calculated from available information.";

/* ------------------------------------------------------------------ */
/* Company                                                             */
/* ------------------------------------------------------------------ */

export type CompanyRole =
  | "manufacturer" | "brand_owner" | "formulator" | "distributor" | "importer"
  | "local_supplier" | "private_label" | "training_provider" | "document_issuer";

export const COMPANY_ROLE_LABEL: Record<CompanyRole, string> = {
  manufacturer: "Manufacturer",
  brand_owner: "Brand owner",
  formulator: "Formulator",
  distributor: "Distributor",
  importer: "Importer",
  local_supplier: "Local supplier",
  private_label: "Private-label company",
  training_provider: "Training provider",
  document_issuer: "Document issuer",
};

export type CompanyVerification =
  | "unverified" | "identity_verified" | "manufacturer_verified" | "distributor_verified"
  | "relationship_unverified" | "suspended" | "archived";

export const COMPANY_VERIFICATION_LABEL: Record<CompanyVerification, string> = {
  unverified: "Unverified",
  identity_verified: "Identity Verified",
  manufacturer_verified: "Manufacturer Verified",
  distributor_verified: "Distributor Verified",
  relationship_unverified: "Relationship Unverified",
  suspended: "Suspended",
  archived: "Archived",
};

export type CompanyRelationshipClaim = {
  relatedCompanyKey?: string;
  relatedCompanyName: string;
  relationshipType: string;
  claimText: string;
  claimSource: string;
  verification: "relationship_unverified" | "verified" | "rejected";
  notes?: string;
};

export type Company = {
  uuid: string;
  key: string;
  companyId: string;           // SM-CMP-000001
  displayName: string;
  legalName?: string;
  tradingName?: string;
  roles: CompanyRole[];
  parentCompanyKey?: string;
  parentVerified: boolean;
  countryOfRegistration?: string;
  headquarters?: string;
  website?: string;
  officialEmail?: string;
  officialPhone?: string;
  isManufacturer: boolean;
  isDistributor: boolean;
  countriesServed: string[];
  languages: string[];
  verification: CompanyVerification;
  verificationSource?: string;
  relationships: CompanyRelationshipClaim[];
  notes?: string;
  logoRef?: string;
  status: "active" | "discontinued" | "archived";
  created: string;
  updated: string;
};

/* ------------------------------------------------------------------ */
/* Kit                                                                 */
/* ------------------------------------------------------------------ */

export type Kit = {
  uuid: string;
  key: string;
  kitId: string;               // SM-KIT-000001
  companyKey: string;
  kitName: string;
  kitDisplayName: string;
  kitEdition?: string;
  kitVersion?: string;
  productCountClaimed?: number;
  productCountVerified: number;
  intendedMarket?: string;
  intendedUsers: string[];
  intendedProcesses: string[];
  countryAvailability: string[];
  language?: string;
  packConfiguration?: string;
  includedAccessories: string[];
  officialKitDocumentKey?: string;
  verification: "unverified" | "provisional_reference_only" | "partially_verified" | "fully_verified";
  effectiveDate?: string;
  reviewDate?: string;
  status: "active" | "discontinued" | "archived";
  notes?: string;
};

/* ------------------------------------------------------------------ */
/* Product identity                                                    */
/* ------------------------------------------------------------------ */

export type ProductStatus =
  | "draft" | "identity_verified" | "documentation_incomplete" | "under_technical_review"
  | "approved" | "published" | "needs_review" | "suspended" | "discontinued" | "archived";

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  draft: "Draft",
  identity_verified: "Identity Verified",
  documentation_incomplete: "Documentation Incomplete",
  under_technical_review: "Under Technical Review",
  approved: "Approved",
  published: "Published",
  needs_review: "Needs Review",
  suspended: "Suspended",
  discontinued: "Discontinued",
  archived: "Archived",
};

/* ------------------------------------------------------------------ */
/* Compatibility vocabularies                                          */
/* ------------------------------------------------------------------ */

export const TEXTILE_KEYS = [
  "cotton", "linen", "wool", "silk", "viscose_rayon", "polyester", "nylon_polyamide",
  "acrylic", "acetate", "triacetate", "elastane", "blends", "leather", "suede", "fur",
  "coated_fabric", "waterproof_fabric", "unknown_material",
] as const;
export type TextileKey = (typeof TEXTILE_KEYS)[number];

export const COLOUR_TARGET_KEYS = [
  "white", "light", "dark", "bright", "multicoloured", "print",
] as const;
export type ColourTargetKey = (typeof COLOUR_TARGET_KEYS)[number];

export const COMPONENT_KEYS = [
  "embroidery", "beads", "sequins", "metallic_thread", "adhesive_construction",
  "coating", "lamination", "interlining", "elastic", "leather_suede_trim",
] as const;
export type ComponentKey = (typeof COMPONENT_KEYS)[number];

export const TARGET_LABEL: Record<string, string> = {
  cotton: "Cotton", linen: "Linen", wool: "Wool", silk: "Silk",
  viscose_rayon: "Viscose / rayon", polyester: "Polyester",
  nylon_polyamide: "Nylon / polyamide", acrylic: "Acrylic", acetate: "Acetate",
  triacetate: "Triacetate", elastane: "Elastane", blends: "Blends",
  leather: "Leather", suede: "Suede", fur: "Fur", coated_fabric: "Coated fabrics",
  waterproof_fabric: "Waterproof fabrics", unknown_material: "Unknown material",
  white: "White textiles", light: "Light colours", dark: "Dark colours",
  bright: "Bright colours", multicoloured: "Multicoloured textiles", print: "Prints",
  embroidery: "Embroidery", beads: "Beads", sequins: "Sequins",
  metallic_thread: "Metallic thread", adhesive_construction: "Adhesive construction",
  coating: "Coatings", lamination: "Laminations", interlining: "Interlinings",
  elastic: "Elastic", leather_suede_trim: "Leather or suede trims",
};

export type Suitability =
  | "suitable" | "suitable_after_testing" | "professional_use_only" | "prohibited"
  | "insufficient_information";

export const SUITABILITY_LABEL: Record<Suitability, string> = {
  suitable: "Suitable",
  suitable_after_testing: "Suitable After Testing",
  professional_use_only: "Professional Use Only",
  prohibited: "Prohibited",
  insufficient_information: INSUFFICIENT_INFO,
};

export type TextileCompatibility = {
  targetKind: "textile" | "colour" | "component";
  targetKey: string;
  suitability: Suitability;
  mainRisk?: string;
  requiredTest?: string;
  source?: string;
  country?: string;
  reviewer?: string;
  approvalStatus: "draft" | "approved";
};

export const PROCESS_KEYS = [
  "professional_laundry", "wet_cleaning", "hand_spotting", "post_spotting_table",
  "pre_spotting", "perc_dry_cleaning", "hydrocarbon_dry_cleaning",
  "silicone_solvent_dry_cleaning", "other_named_solvent", "water_flushing",
  "steam_flushing", "air_drying",
] as const;
export type ProcessKey = (typeof PROCESS_KEYS)[number];

export const PROCESS_LABEL: Record<ProcessKey, string> = {
  professional_laundry: "Professional laundry",
  wet_cleaning: "Wet cleaning",
  hand_spotting: "Hand spotting",
  post_spotting_table: "Post-spotting table",
  pre_spotting: "Pre-spotting",
  perc_dry_cleaning: "Perchloroethylene dry cleaning",
  hydrocarbon_dry_cleaning: "Hydrocarbon dry cleaning",
  silicone_solvent_dry_cleaning: "Silicone-solvent dry cleaning",
  other_named_solvent: "Other named solvent system",
  water_flushing: "Water flushing",
  steam_flushing: "Steam flushing",
  air_drying: "Air drying",
};

export type ProcessPermission =
  | "permitted" | "prohibited" | "machine_entry_prohibited" | "process_not_established";

export const PROCESS_PERMISSION_LABEL: Record<ProcessPermission, string> = {
  permitted: "Permitted",
  prohibited: "Prohibited",
  machine_entry_prohibited: "Machine introduction prohibited",
  process_not_established: "Process not established",
};

export type ProcessCompatibility = {
  processKey: ProcessKey;
  permitted: ProcessPermission;
  rinsingDestination?: string;
  machineEntryRestriction?: string;
  requiredEquipment?: string;
  source?: string;
  country?: string;
  verification: "unverified" | "verified";
};

/* ------------------------------------------------------------------ */
/* Chemistry / claims / instructions                                   */
/* ------------------------------------------------------------------ */

export type Disclosure = "disclosed" | "not_disclosed";

export type ActiveChemistry = {
  ingredients: { name: string; concentration?: string }[]; // empty => Not disclosed
  chemicalFamily: string;
  solventFamily: string;
  ph?: string;
  physicalProperties?: string;
  flashPoint?: string;
  enzymePresence: Disclosure | "present" | "absent";
  oxidizing: Disclosure | "yes" | "no";
  reducing: Disclosure | "yes" | "no";
  acidic: Disclosure | "yes" | "no";
  alkaline: Disclosure | "yes" | "no";
  surfactantType: string;
  hazardousComponents: string[];
  disclosureSource?: string;
  disclosureConfidence: "none" | "low" | "moderate" | "high";
};

export const UNDISCLOSED_CHEMISTRY: ActiveChemistry = {
  ingredients: [],
  chemicalFamily: NOT_DISCLOSED,
  solventFamily: NOT_DISCLOSED,
  enzymePresence: "not_disclosed",
  oxidizing: "not_disclosed",
  reducing: "not_disclosed",
  acidic: "not_disclosed",
  alkaline: "not_disclosed",
  surfactantType: NOT_DISCLOSED,
  hazardousComponents: [],
  disclosureConfidence: "none",
};

export type ManufacturerClaim = {
  claimedStain: string;
  claimedCategory?: string;
  sourceDocumentKey?: string;
  sourceDescription: string;
  documentVersion?: string;
  country?: string;
  sectionReference?: string;
  claimStatus: "claimed_not_verified" | "claim_withdrawn" | "claim_disputed";
  notes?: string;
};

export type UseVerification = {
  claimedStain: string;
  verification: "unverified" | "pending_review" | "verified" | "insufficient_information" | "disputed";
  evidenceLevel: "manufacturer_claim" | "label_documented" | "sds_tds_documented" | "independent_trial" | "textile_standard" | "none";
  internalTrialReference?: string;
  reviewer?: string;
  restriction?: string;
  approvalStatus: "draft" | "approved";
};

export type InstructionOrigin =
  | "manufacturer_documented" | "distributor_documented" | "training_provider_documented"
  | "internal_trial" | "local_practice" | "unverified" | "rejected";

export const INSTRUCTION_ORIGIN_LABEL: Record<InstructionOrigin, string> = {
  manufacturer_documented: "Manufacturer Documented",
  distributor_documented: "Distributor Documented",
  training_provider_documented: "Training Provider Documented",
  internal_trial: "Internal Trial",
  local_practice: "Local Practice",
  unverified: "Unverified",
  rejected: "Rejected",
};

export type Instruction = {
  id: string;
  applicationStage: string;
  stepOrder: number;
  surfacePreparation?: string;
  productQuantity?: string;
  dilution?: string;
  applicationMethod?: string;
  mechanicalAction?: string;
  contactTime?: string;
  temperature?: string;
  moistureRequirement?: string;
  reapplicationRule?: string;
  rinsing?: string;
  flushing?: string;
  neutralization?: string;
  drying?: string;
  inspectionPoint?: string;
  maximumAttempts?: string;
  stopConditions: string[];
  requiredEquipment?: string;
  trainingRequirement?: string;
  origin: InstructionOrigin;
  sourceDocumentKey?: string;
  sourceDescription: string;
  documentType?: DocumentType;
  documentVersion?: string;
  country?: string;
  sectionReference?: string;
  reviewer?: string;
  approvalStatus: "draft" | "approved" | "blocked";
};

/* ------------------------------------------------------------------ */
/* Safety                                                              */
/* ------------------------------------------------------------------ */

export type SafetyData = {
  signalWord?: string;
  pictograms: string[];
  hazardStatements: string[];
  precautionaryStatements: string[];
  routesOfExposure: string[];
  firstAidSummary?: string;
  spillResponse?: string;
  storage?: string;
  disposal?: string;
  transportClassification?: string;
  environmentalPrecautions?: string;
  incompatibleMaterials: string[];
  exposureLimits?: string;
  emergencyContact?: string;
  sdsCountry?: string;
  sdsLanguage?: string;
  sdsRevisionDate?: string;
  sdsVersion?: string;
  sourceDocumentKey?: string;
  verification: "unverified" | "verified";
};

export const NO_SAFETY_DATA: SafetyData = {
  pictograms: [], hazardStatements: [], precautionaryStatements: [],
  routesOfExposure: [], incompatibleMaterials: [], verification: "unverified",
};

export const PPE_KEYS = [
  "protective_gloves", "eye_protection", "face_protection", "protective_clothing",
  "respiratory_protection", "ventilation", "local_exhaust", "ignition_source_control",
  "other_engineering_control",
] as const;
export type PpeKey = (typeof PPE_KEYS)[number];

export const PPE_LABEL: Record<PpeKey, string> = {
  protective_gloves: "Protective gloves",
  eye_protection: "Eye protection",
  face_protection: "Face protection",
  protective_clothing: "Protective clothing",
  respiratory_protection: "Respiratory protection",
  ventilation: "Ventilation",
  local_exhaust: "Local exhaust",
  ignition_source_control: "Ignition-source control",
  other_engineering_control: "Other engineering controls",
};

export type PpeRequirement = {
  ppeKey: PpeKey;
  level: "required" | "recommended" | "not_established";
  material?: string;
  breakthroughTime?: string;
  taskOrProcess?: string;
  source?: string;
  country?: string;
  reviewer?: string;
};

export const INCOMPATIBILITY_KINDS = [
  "oxidizing_agent", "reducing_agent", "acid", "alkali", "chlorine_bleach", "ammonia",
  "solvent", "water", "heat", "ignition_source", "other_spotting_agent", "named_product",
  "storage", "unknown_previous_chemical",
] as const;
export type IncompatibilityKind = (typeof INCOMPATIBILITY_KINDS)[number];

export type Incompatibility = {
  kind: IncompatibilityKind;
  incompatibleWith: string;
  incompatibleProductKey?: string;
  incompatibilityType: string;
  severity: "critical" | "important" | "advisory";
  requiredSeparation?: string;
  source?: string;
  reviewer?: string;
  approvalStatus: "draft" | "approved";
};

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

export type DocumentType =
  | "product_label" | "sds" | "tds" | "product_information_sheet" | "manufacturer_instruction"
  | "spotting_chart" | "kit_brochure" | "distributor_instruction" | "training_document"
  | "regulatory_document" | "internal_trial" | "price_list" | "pack_photograph";

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  product_label: "Product label",
  sds: "Safety Data Sheet",
  tds: "Technical Data Sheet",
  product_information_sheet: "Product information sheet",
  manufacturer_instruction: "Manufacturer instruction",
  spotting_chart: "Spotting chart",
  kit_brochure: "Kit brochure",
  distributor_instruction: "Distributor instruction",
  training_document: "Training document",
  regulatory_document: "Regulatory document",
  internal_trial: "Internal trial",
  price_list: "Price list",
  pack_photograph: "Pack photograph",
};

/** Document authority hierarchy — index 0 is the highest authority (§18). */
export const DOCUMENT_HIERARCHY: DocumentType[] = [
  "product_label",
  "sds",
  "tds",
  "manufacturer_instruction",
  "kit_brochure",
  "distributor_instruction",
  "product_information_sheet",
  "internal_trial",
  "training_document",
  "spotting_chart",
  "regulatory_document",
  "price_list",
  "pack_photograph",
];

/** A spotting chart alone may never authorise these (§18). */
export const CHART_CANNOT_AUTHORISE = [
  "ppe", "chemical_compatibility", "dilution", "contact_time", "neutralization",
  "machine_compatibility", "storage", "hazard_handling",
] as const;

export type DocumentState =
  | "uploaded" | "extraction_pending" | "extracted" | "under_review" | "current_and_verified"
  | "country_mismatch" | "version_conflict" | "superseded" | "expired_review" | "incomplete"
  | "rejected" | "archived";

export const DOCUMENT_STATE_LABEL: Record<DocumentState, string> = {
  uploaded: "Uploaded",
  extraction_pending: "Extraction Pending",
  extracted: "Extracted",
  under_review: "Under Review",
  current_and_verified: "Current and Verified",
  country_mismatch: "Country Mismatch",
  version_conflict: "Version Conflict",
  superseded: "Superseded",
  expired_review: "Expired Review",
  incomplete: "Incomplete",
  rejected: "Rejected",
  archived: "Archived",
};

export type ProductDocument = {
  key: string;
  documentId: string;          // SM-DOC-000001
  productKey?: string;
  kitKey?: string;
  companyKey: string;
  documentType: DocumentType;
  title: string;
  issuer?: string;
  issuerUncertain: boolean;
  country?: string;
  language?: string;
  publicationDate?: string;
  revisionDate?: string;
  version?: string;
  effectiveDate?: string;
  expiryOrReviewDate?: string;
  file?: string;
  sourceUrl?: string;
  fileHash?: string;
  state: DocumentState;
  supersededByKey?: string;
  reviewer?: string;
  reviewDate?: string;
  notes?: string;
};

export const EXTRACTION_FIELDS = [
  "product_name", "product_code", "manufacturer", "intended_use", "application_instructions",
  "dilution", "contact_time", "temperature", "rinsing", "neutralization", "textile_restrictions",
  "colour_restrictions", "ppe", "ventilation", "storage", "hazards", "incompatibilities",
  "version", "country", "date",
] as const;
export type ExtractionField = (typeof EXTRACTION_FIELDS)[number];

/** Extraction fields that AI may never publish directly (§20). */
export const SAFETY_CRITICAL_FIELDS: ExtractionField[] = [
  "dilution", "contact_time", "temperature", "neutralization", "ppe", "ventilation",
  "hazards", "incompatibilities", "textile_restrictions", "colour_restrictions", "storage",
];

export type Extraction = {
  id: string;
  documentKey: string;
  productKey?: string;
  field: ExtractionField;
  value: string;
  pageOrSection?: string;
  confidence: number;          // 0..1
  userConfirmed: boolean;
  confirmedBy?: string;
  reviewerApproved: boolean;
  reviewer?: string;
};

/* ------------------------------------------------------------------ */
/* Pack, cost, country, training                                       */
/* ------------------------------------------------------------------ */

export type Pack = {
  packSize?: number;
  measurementUnit?: string;
  containerType?: string;
  bottleColour?: string;
  closureType?: string;
  includedApplicator?: string;
  kitQuantity?: number;
  caseQuantity?: number;
  country?: string;
  sku?: string;
  barcode?: string;
  effectiveDate?: string;
  verificationSource?: string;
  claimedOnly: boolean;
};

export type CostInputs = {
  purchasePrice?: number;
  currency?: string;
  taxStatus?: string;
  shippingAllocation?: number;
  packSize?: number;
  usableQuantity?: number;
  estimatedWaste?: number;
  verifiedDose?: number;
  doseUnit?: string;
  doseVerified: boolean;
  priceSource?: string;
  priceDate?: string;
  country?: string;
  organizationKey?: string;
};

export const TRAINING_KEYS = [
  "domestic_use_prohibited", "general_professional_use", "trained_spotter_required",
  "supervisor_approval_required", "specialist_use", "manufacturer_training_required",
  "equipment_training_required", "ppe_training_required", "hazard_communication_required",
] as const;
export type TrainingKey = (typeof TRAINING_KEYS)[number];

export const TRAINING_LABEL: Record<TrainingKey, string> = {
  domestic_use_prohibited: "Domestic use prohibited",
  general_professional_use: "General professional use",
  trained_spotter_required: "Trained spotter required",
  supervisor_approval_required: "Supervisor approval required",
  specialist_use: "Specialist use",
  manufacturer_training_required: "Manufacturer training required",
  equipment_training_required: "Equipment training required",
  ppe_training_required: "PPE training required",
  hazard_communication_required: "Hazard communication required",
};

export type CountryApplicability = {
  country: string;
  marketStatus: "unconfirmed" | "available" | "not_available" | "withdrawn";
  approvedDistributor?: string;
  labelLanguage?: string;
  sdsJurisdiction?: string;
  regulatoryClassification?: string;
  measurementUnits: "metric" | "imperial";
  emergencyContact?: string;
  availability?: string;
  importStatus?: string;
  documentCompleteness: "complete" | "partial" | "incomplete";
  countryMismatch: boolean;
};

/* ------------------------------------------------------------------ */
/* Product version (immutable) and product                             */
/* ------------------------------------------------------------------ */

export type ProductVersion = {
  uuid: string;
  key: string;
  productKey: string;
  versionRef: string;           // v1, v2 …
  formulationIdentifier?: string;
  country: string;
  market?: string;
  effectiveDate?: string;
  endDate?: string;
  productCode?: string;
  labelVersion?: string;
  sdsVersion?: string;
  tdsVersion?: string;
  instructionVersion?: string;
  knownFormulationChange: boolean;
  changeSummary?: string;
  verification: "unverified" | "pending_review" | "verified" | "insufficient_information" | "disputed";
  reviewer?: string;
  approvalStatus: "draft" | "under_review" | "approved" | "superseded";
  supersededByKey?: string;
  immutable: true;

  chemistry: ActiveChemistry;
  textile: TextileCompatibility[];
  processes: ProcessCompatibility[];
  instructions: Instruction[];
  safety: SafetyData;
  ppe: PpeRequirement[];
  incompatibilities: Incompatibility[];
  packs: Pack[];
  countries: CountryApplicability[];
  training: Partial<Record<TrainingKey, boolean>>;
  cost?: CostInputs;
  documentKeys: string[];
};

export type Product = {
  uuid: string;
  key: string;
  productId: string;            // SM-PRD-000001
  companyKey: string;
  brand?: string;
  canonicalName: string;
  displayName: string;
  productCode?: string;
  alternativeNames: string[];
  previousNames: string[];
  replacementProductKey?: string;
  productType?: string;
  physicalForm?: string;
  productColour?: string;
  odourDescription?: string;    // only when documented
  intendedProfessionalUse?: string;
  intendedProcesses: string[];
  countryFormulation?: string;
  language?: string;
  claims: ManufacturerClaim[];
  verifications: UseVerification[];
  versions: ProductVersion[];
  currentVersionKey: string;
  provisional: boolean;
  status: ProductStatus;
  discontinuedDate?: string;
  created: string;
  updated: string;
  reviewFlags: string[];
};

/* ------------------------------------------------------------------ */
/* ID helpers                                                          */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(6, "0");
export const formatCompanyId = (n: number) => `SM-CMP-${pad(n)}`;
export const formatKitId = (n: number) => `SM-KIT-${pad(n)}`;
export const formatProductId = (n: number) => `SM-PRD-${pad(n)}`;
export const formatDocumentId = (n: number) => `SM-DOC-${pad(n)}`;

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

const TODAY = "2026-08-17";

export const COMPANIES: Company[] = [
  {
    uuid: "cmp-seitz", key: "seitz", companyId: formatCompanyId(1),
    displayName: "Seitz", legalName: "Seitz GmbH (to be confirmed from official documentation)",
    roles: ["manufacturer", "brand_owner"],
    parentVerified: false,
    countryOfRegistration: "Germany",
    headquarters: "Not confirmed",
    website: "https://www.seitz24.com",
    isManufacturer: true, isDistributor: false,
    countriesServed: [], languages: ["de", "en"],
    verification: "unverified",
    verificationSource: "No official registration or manufacturing document held yet.",
    relationships: [
      {
        relatedCompanyName: "Clean Craft",
        relationshipType: "suggested_commercial_relationship",
        claimText: "A supplied chart suggests a link between Clean Craft and Seitz.",
        claimSource: "Supplied spotting chart (issuer uncertain)",
        verification: "relationship_unverified",
        notes: "Do not present Clean Craft branding as a Seitz relationship until official manufacturer or commercial documentation confirms it.",
      },
    ],
    notes: "Website domain alone is not proof of manufacturing or distribution rights.",
    status: "active", created: TODAY, updated: TODAY,
  },
  {
    uuid: "cmp-stas", key: "stas", companyId: formatCompanyId(2),
    displayName: "STAS",
    roles: ["brand_owner"],
    parentVerified: false,
    isManufacturer: false, isDistributor: false,
    countriesServed: [], languages: ["en"],
    verification: "unverified",
    verificationSource: "No official documentation held.",
    relationships: [],
    notes: "Manufacturer, formulator and distributor roles are unknown and must not be assumed.",
    status: "active", created: TODAY, updated: TODAY,
  },
  {
    uuid: "cmp-cleancraft", key: "clean_craft", companyId: formatCompanyId(3),
    displayName: "Clean Craft",
    roles: ["brand_owner", "distributor"],
    parentVerified: false,
    isManufacturer: false, isDistributor: true,
    countriesServed: ["IN"], languages: ["en"],
    verification: "unverified",
    verificationSource: "Supplied spotting chart only; issuer uncertain.",
    relationships: [
      {
        relatedCompanyKey: "seitz",
        relatedCompanyName: "Seitz",
        relationshipType: "suggested_commercial_relationship",
        claimText: "Supplied material suggests a Clean Craft / Seitz association.",
        claimSource: "Supplied spotting chart (issuer uncertain)",
        verification: "relationship_unverified",
        notes: "Stored as an unverified claim. Not shown as manufacturing or ownership.",
      },
    ],
    status: "active", created: TODAY, updated: TODAY,
  },
];

export const DOCUMENTS: ProductDocument[] = [
  {
    key: "doc_seitz_chart", documentId: formatDocumentId(1),
    kitKey: "seitz_seven_bottle", companyKey: "seitz",
    documentType: "spotting_chart",
    title: "Seitz seven-bottle spotting chart (supplied reference)",
    issuer: "Unconfirmed", issuerUncertain: true,
    language: "en",
    state: "uploaded",
    notes: "Provisional reference material. A spotting chart alone cannot authorise PPE, dilution, contact time, neutralisation, machine compatibility, storage or hazard handling.",
  },
  {
    key: "doc_cleancraft_chart", documentId: formatDocumentId(2),
    kitKey: "clean_craft_nine_bottle", companyKey: "clean_craft",
    documentType: "spotting_chart",
    title: "Clean Craft nine-bottle spotting chart (supplied reference)",
    issuer: "Unconfirmed", issuerUncertain: true,
    country: "IN", language: "en",
    state: "uploaded",
    notes: "Chart-claimed pack size of 200 ml per bottle. Not verified against labels.",
  },
  {
    key: "doc_stas_chart", documentId: formatDocumentId(3),
    kitKey: "stas_stain_n_kit", companyKey: "stas",
    documentType: "spotting_chart",
    title: "STAS Stain N Kit chart (not yet supplied to the database)",
    issuer: "Unconfirmed", issuerUncertain: true,
    language: "en",
    state: "incomplete",
    notes: "Product identities cannot be extracted until the chart file is supplied. No STAS product identities have been invented.",
  },
];

export const KITS: Kit[] = [
  {
    uuid: "kit-seitz-7", key: "seitz_seven_bottle", kitId: formatKitId(1), companyKey: "seitz",
    kitName: "Seitz seven-bottle professional spotting system",
    kitDisplayName: "Seitz seven-bottle spotting system",
    productCountClaimed: 7, productCountVerified: 0,
    intendedMarket: "Professional dry cleaning and spotting",
    intendedUsers: ["professional_spotter", "dry_cleaner"],
    intendedProcesses: ["hand_spotting", "pre_spotting", "post_spotting_table"],
    countryAvailability: [],
    packConfiguration: "Seven bottles (chart-claimed)",
    includedAccessories: [],
    officialKitDocumentKey: "doc_seitz_chart",
    verification: "provisional_reference_only",
    status: "active",
    notes: "Do not assume all seven products can be intermixed. Do not assume compatibility with all dry-cleaning solvents.",
  },
  {
    uuid: "kit-stas", key: "stas_stain_n_kit", kitId: formatKitId(2), companyKey: "stas",
    kitName: "STAS Stain N Kit",
    kitDisplayName: "STAS Stain N Kit",
    productCountVerified: 0,
    intendedUsers: ["professional_spotter"],
    intendedProcesses: ["hand_spotting"],
    countryAvailability: [],
    includedAccessories: [],
    officialKitDocumentKey: "doc_stas_chart",
    verification: "unverified",
    status: "active",
    notes: "Awaiting the supplied STAS chart. Product identities, spellings and codes will be transcribed exactly as printed — none have been invented.",
  },
  {
    uuid: "kit-cc-9", key: "clean_craft_nine_bottle", kitId: formatKitId(3), companyKey: "clean_craft",
    kitName: "Clean Craft nine-bottle spotting system",
    kitDisplayName: "Clean Craft nine-bottle spotting system",
    productCountClaimed: 9, productCountVerified: 0,
    intendedMarket: "Professional spotting (India)",
    intendedUsers: ["professional_spotter", "dry_cleaner"],
    intendedProcesses: ["hand_spotting", "pre_spotting"],
    countryAvailability: ["IN"],
    language: "en",
    packConfiguration: "Nine bottles, 200 ml each (chart-claimed, unverified)",
    includedAccessories: [],
    officialKitDocumentKey: "doc_cleancraft_chart",
    verification: "provisional_reference_only",
    status: "active",
    notes: "General steam-first instruction and protein-related steam instructions are flagged for technical and safety review.",
  },
];

/* --------- version + product builders (safety-first defaults) --------- */

let versionSeq = 0;

function provisionalVersion(
  productKey: string,
  opts: Partial<ProductVersion> & { country: string },
): ProductVersion {
  versionSeq += 1;
  return {
    uuid: `pv-${productKey}-${versionSeq}`,
    key: `${productKey}__${opts.versionRef ?? "v1"}__${opts.country}`,
    productKey,
    versionRef: "v1",
    knownFormulationChange: false,
    verification: "unverified",
    approvalStatus: "draft",
    immutable: true,
    chemistry: { ...UNDISCLOSED_CHEMISTRY },
    textile: [],
    processes: [],
    instructions: [],
    safety: { ...NO_SAFETY_DATA },
    ppe: [],
    incompatibilities: [],
    packs: [],
    countries: [],
    training: { domestic_use_prohibited: true, trained_spotter_required: true },
    documentKeys: [],
    ...opts,
  };
}

let productSeq = 0;

function provisionalProduct(
  key: string,
  name: string,
  companyKey: string,
  extra: Partial<Product> = {},
  versionExtra: Partial<ProductVersion> & { country?: string } = {},
): Product {
  productSeq += 1;
  const version = provisionalVersion(key, { country: "unspecified", ...versionExtra });
  return {
    uuid: `prd-${key}`,
    key,
    productId: formatProductId(productSeq),
    companyKey,
    brand: COMPANIES.find((c) => c.key === companyKey)?.displayName,
    canonicalName: name,
    displayName: name,
    alternativeNames: [],
    previousNames: [],
    intendedProcesses: [],
    claims: [],
    verifications: [],
    versions: [version],
    currentVersionKey: version.key,
    provisional: true,
    status: "documentation_incomplete",
    created: TODAY,
    updated: TODAY,
    reviewFlags: [],
    ...extra,
  };
}

const seitzNames = ["Purasol", "Quickol", "Lacol", "Frankosol", "Cavesol", "Blutol", "Colorsol"];

const seitzProducts: Product[] = seitzNames.map((n, i) =>
  provisionalProduct(`seitz_${n.toLowerCase()}`, n, "seitz", {
    intendedProfessionalUse: "Recorded from a provisional chart. Intended use is not verified.",
    claims: [
      {
        claimedStain: "See supplied chart",
        sourceDocumentKey: "doc_seitz_chart",
        sourceDescription: "Seitz seven-bottle spotting chart (issuer uncertain)",
        claimStatus: "claimed_not_verified",
        notes: "Chart claim only. Not independently verified performance.",
      },
    ],
    reviewFlags: [
      "Current label, SDS, TDS and country applicability are required before any instruction is published.",
      ...(n === "Cavesol" || n === "Blutol"
        ? ["Any Cavesol/Blutol incompatibility must be recorded at product-version level once documented. Intermixing is not assumed to be safe."]
        : []),
    ],
  }, { country: "unspecified", versionRef: "v1" }),
);

const cleanCraftNames = [
  "Food 1", "Food 2", "Colour 1", "Colour 2", "Fungus Go", "Organic", "Oil 1", "Oil 2", "Rust Go",
];

const cleanCraftProducts: Product[] = cleanCraftNames.map((n) => {
  const key = `cc_${n.toLowerCase().replace(/\s+/g, "_")}`;
  const flags = [
    "Chart-claimed 200 ml pack size is unverified against the product label.",
    "Do not infer chemistry from the product name.",
    "General steam-first instruction on the supplied chart is flagged for technical review.",
  ];
  if (n === "Fungus Go") {
    flags.push(
      "Chart description inconsistency: the supplied chart describes colour transfer rather than fungal staining. Flagged for review.",
    );
  }
  if (n === "Organic") {
    flags.push("Protein-related steam instruction on the supplied chart is flagged for safety review.");
  }
  return provisionalProduct(key, n, "clean_craft", {
    intendedProfessionalUse: "Chart-claimed use only. Not verified.",
    countryFormulation: "IN",
    claims: [
      {
        claimedStain: "See supplied chart",
        sourceDocumentKey: "doc_cleancraft_chart",
        sourceDescription: "Clean Craft nine-bottle spotting chart (issuer uncertain)",
        country: "IN",
        claimStatus: "claimed_not_verified",
      },
    ],
    reviewFlags: flags,
  }, {
    country: "IN",
    versionRef: "v1",
    packs: [{
      packSize: 200, measurementUnit: "ml", containerType: "bottle",
      country: "IN", claimedOnly: true,
      verificationSource: "Clean Craft chart claim, not label-verified",
    }],
    countries: [{
      country: "IN", marketStatus: "unconfirmed", measurementUnits: "metric",
      documentCompleteness: "incomplete", countryMismatch: false,
    }],
    documentKeys: ["doc_cleancraft_chart"],
  });
});

export const PRODUCTS: Product[] = [...seitzProducts, ...cleanCraftProducts];

export const KIT_PRODUCTS: { kitKey: string; productKey: string; position: number; claimedPackSize?: string }[] = [
  ...seitzProducts.map((p, i) => ({ kitKey: "seitz_seven_bottle", productKey: p.key, position: i + 1 })),
  ...cleanCraftProducts.map((p, i) => ({
    kitKey: "clean_craft_nine_bottle", productKey: p.key, position: i + 1,
    claimedPackSize: "200 ml (chart-claimed)",
  })),
];

export const LAST_COMPANY_SEQ = COMPANIES.length;
export const LAST_KIT_SEQ = KITS.length;
export const LAST_PRODUCT_SEQ = PRODUCTS.length;
export const LAST_DOCUMENT_SEQ = DOCUMENTS.length;

export const COMPANY_BY_KEY = Object.fromEntries(COMPANIES.map((c) => [c.key, c])) as Record<string, Company>;
export const KIT_BY_KEY = Object.fromEntries(KITS.map((k) => [k.key, k])) as Record<string, Kit>;
export const PRODUCT_BY_KEY = Object.fromEntries(PRODUCTS.map((p) => [p.key, p])) as Record<string, Product>;
export const DOCUMENT_BY_KEY = Object.fromEntries(DOCUMENTS.map((d) => [d.key, d])) as Record<string, ProductDocument>;
