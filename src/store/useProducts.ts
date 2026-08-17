/** STEP 7 — professional product governance store (companies, kits, products, documents, audit). */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  COMPANIES, KITS, PRODUCTS, DOCUMENTS, KIT_PRODUCTS,
} from "@/data/professionalProducts";
import type {
  Company, Kit, Product, ProductDocument, ProductVersion, ProductStatus, Extraction,
} from "@/data/professionalProducts";
import {
  allocateCompanyId, allocateKitId, allocateProductId, allocateDocumentId,
  addVersion, discontinue, linkReplacement, requiresJustification, currentVersion,
} from "@/lib/productEngine";

export type AuditEntry = {
  id: string;
  at: string;
  entity: string;
  entityKey: string;
  action: string;
  field?: string;
  previousValue?: string;
  newValue?: string;
  reason: string;
  changedBy: string;
  safetyCritical: boolean;
};

export type InventoryItem = {
  id: string;
  organizationKey: string;
  productKey: string;
  productVersionKey: string;
  packSize?: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  dateOpened?: string;
  storageLocation?: string;
  localPrice?: number;
  approvedForUse: boolean;
  staffPermissions: string[];
  documentAvailability: "complete" | "partial" | "unknown";
  notes?: string;
};

type ProductsState = {
  companyOverrides: Record<string, Partial<Company>>;
  customCompanies: Company[];
  kitOverrides: Record<string, Partial<Kit>>;
  customKits: Kit[];
  productOverrides: Record<string, Partial<Product>>;
  customProducts: Product[];
  documentOverrides: Record<string, Partial<ProductDocument>>;
  customDocuments: ProductDocument[];
  kitLinks: { kitKey: string; productKey: string; position: number; claimedPackSize?: string }[];
  extractions: Extraction[];
  inventory: InventoryItem[];
  audit: AuditEntry[];

  companies: () => Company[];
  kits: () => Kit[];
  products: () => Product[];
  documents: () => ProductDocument[];

  createCompany: (name: string, by: string) => Company;
  createKit: (companyKey: string, name: string, by: string) => Kit;
  createProduct: (companyKey: string, name: string, by: string) => Product;
  addDocument: (doc: Omit<ProductDocument, "documentId">, by: string) => ProductDocument;
  linkProductToKit: (kitKey: string, productKey: string) => void;

  updateProduct: (key: string, patch: Partial<Product>, opts: { by: string; reason: string; change?: string }) => string | null;
  setProductStatus: (key: string, status: ProductStatus, by: string, reason: string) => void;
  newVersion: (key: string, patch: Partial<ProductVersion> & { country: string; changeSummary: string }, by: string) => void;
  markDiscontinued: (key: string, date: string, by: string, replacementKey?: string) => void;
  supersede: (documentKey: string, replacementKey: string, by: string) => void;
  addExtraction: (e: Extraction) => void;
  confirmExtraction: (id: string, by: string) => void;
  approveExtraction: (id: string, reviewer: string) => void;
  upsertInventory: (item: InventoryItem) => void;
  log: (e: Omit<AuditEntry, "id" | "at">) => void;
  reset: () => void;
};

const merge = <T,>(base: T, patch?: Partial<T>): T => (patch ? { ...base, ...patch } : base);
const today = () => new Date().toISOString().slice(0, 10);

export const useProducts = create<ProductsState>()(
  persist(
    (set, get) => ({
      companyOverrides: {}, customCompanies: [],
      kitOverrides: {}, customKits: [],
      productOverrides: {}, customProducts: [],
      documentOverrides: {}, customDocuments: [],
      kitLinks: [...KIT_PRODUCTS],
      extractions: [],
      inventory: [],
      audit: [],

      companies: () => {
        const { companyOverrides, customCompanies } = get();
        return [...COMPANIES.map((c) => merge(c, companyOverrides[c.key])), ...customCompanies];
      },
      kits: () => {
        const { kitOverrides, customKits } = get();
        return [...KITS.map((k) => merge(k, kitOverrides[k.key])), ...customKits];
      },
      products: () => {
        const { productOverrides, customProducts } = get();
        return [...PRODUCTS.map((p) => merge(p, productOverrides[p.key])), ...customProducts];
      },
      documents: () => {
        const { documentOverrides, customDocuments } = get();
        return [...DOCUMENTS.map((d) => merge(d, documentOverrides[d.key])), ...customDocuments];
      },

      log: (e) =>
        set((st) => ({
          audit: [{ id: `a${st.audit.length + 1}`, at: new Date().toISOString(), ...e }, ...st.audit].slice(0, 500),
        })),

      createCompany: (name, by) => {
        const company: Company = {
          uuid: `cmp-${Date.now()}`,
          key: `cmp_${Date.now()}`,
          companyId: allocateCompanyId(get().companies()),
          displayName: name,
          roles: [],
          parentVerified: false,
          isManufacturer: false,
          isDistributor: false,
          countriesServed: [],
          languages: [],
          verification: "unverified",
          relationships: [],
          status: "active",
          created: today(),
          updated: today(),
        };
        set((st) => ({ customCompanies: [...st.customCompanies, company] }));
        get().log({ entity: "company", entityKey: company.key, action: "create", reason: "New company", changedBy: by, safetyCritical: false, newValue: name });
        return company;
      },

      createKit: (companyKey, name, by) => {
        const kit: Kit = {
          uuid: `kit-${Date.now()}`,
          key: `kit_${Date.now()}`,
          kitId: allocateKitId(get().kits()),
          companyKey,
          kitName: name,
          kitDisplayName: name,
          productCountVerified: 0,
          intendedUsers: [],
          intendedProcesses: [],
          countryAvailability: [],
          includedAccessories: [],
          verification: "unverified",
          status: "active",
        };
        set((st) => ({ customKits: [...st.customKits, kit] }));
        get().log({ entity: "kit", entityKey: kit.key, action: "create", reason: "New kit", changedBy: by, safetyCritical: false, newValue: name });
        return kit;
      },

      createProduct: (companyKey, name, by) => {
        const key = `prd_${Date.now()}`;
        const version: ProductVersion = {
          uuid: `pv-${key}`,
          key: `${key}__v1__unspecified`,
          productKey: key,
          versionRef: "v1",
          country: "unspecified",
          knownFormulationChange: false,
          verification: "unverified",
          approvalStatus: "draft",
          immutable: true,
          chemistry: {
            ingredients: [], chemicalFamily: "Not disclosed", solventFamily: "Not disclosed",
            enzymePresence: "not_disclosed", oxidizing: "not_disclosed", reducing: "not_disclosed",
            acidic: "not_disclosed", alkaline: "not_disclosed", surfactantType: "Not disclosed",
            hazardousComponents: [], disclosureConfidence: "none",
          },
          textile: [], processes: [], instructions: [],
          safety: { pictograms: [], hazardStatements: [], precautionaryStatements: [], routesOfExposure: [], incompatibleMaterials: [], verification: "unverified" },
          ppe: [], incompatibilities: [], packs: [], countries: [],
          training: { domestic_use_prohibited: true },
          documentKeys: [],
        };
        const product: Product = {
          uuid: `prd-${key}`, key,
          productId: allocateProductId(get().products()),
          companyKey,
          canonicalName: name,
          displayName: name,
          alternativeNames: [], previousNames: [], intendedProcesses: [],
          claims: [], verifications: [],
          versions: [version], currentVersionKey: version.key,
          provisional: true, status: "draft",
          created: today(), updated: today(), reviewFlags: [],
        };
        set((st) => ({ customProducts: [...st.customProducts, product] }));
        get().log({ entity: "product", entityKey: key, action: "create", reason: "New product identity", changedBy: by, safetyCritical: false, newValue: name });
        return product;
      },

      addDocument: (doc, by) => {
        const full: ProductDocument = { ...doc, documentId: allocateDocumentId(get().documents()) };
        set((st) => ({ customDocuments: [...st.customDocuments, full] }));
        get().log({ entity: "document", entityKey: full.key, action: "upload", reason: `Uploaded ${full.documentType}`, changedBy: by, safetyCritical: false, newValue: full.title });
        return full;
      },

      linkProductToKit: (kitKey, productKey) =>
        set((st) =>
          st.kitLinks.some((l) => l.kitKey === kitKey && l.productKey === productKey)
            ? st
            : { kitLinks: [...st.kitLinks, { kitKey, productKey, position: st.kitLinks.length + 1 }] },
        ),

      updateProduct: (key, patch, { by, reason, change }) => {
        if (change && requiresJustification(change) && !reason.trim()) {
          return "A written justification is required for this change.";
        }
        set((st) => {
          if (st.customProducts.some((p) => p.key === key)) {
            return { customProducts: st.customProducts.map((p) => (p.key === key ? { ...p, ...patch, updated: today() } : p)) };
          }
          return { productOverrides: { ...st.productOverrides, [key]: { ...(st.productOverrides[key] ?? {}), ...patch, updated: today() } } };
        });
        get().log({
          entity: "product", entityKey: key, action: change ?? "update",
          reason, changedBy: by, newValue: JSON.stringify(patch).slice(0, 240),
          safetyCritical: !!change && requiresJustification(change),
        });
        return null;
      },

      setProductStatus: (key, status, by, reason) => {
        get().updateProduct(key, { status }, { by, reason });
      },

      newVersion: (key, patch, by) => {
        const product = get().products().find((p) => p.key === key);
        if (!product) return;
        const updated = addVersion(product, patch);
        get().updateProduct(key, {
          versions: updated.versions,
          currentVersionKey: updated.currentVersionKey,
          status: updated.status,
        }, { by, reason: patch.changeSummary, change: "active_chemistry" });
      },

      markDiscontinued: (key, date, by, replacementKey) => {
        const products = get().products();
        const product = products.find((p) => p.key === key);
        if (!product) return;
        const d = discontinue(product, date, replacementKey);
        get().updateProduct(key, { status: d.status, discontinuedDate: d.discontinuedDate, replacementProductKey: d.replacementProductKey }, { by, reason: "Marked discontinued" });
        const replacement = replacementKey ? products.find((p) => p.key === replacementKey) : undefined;
        if (replacement) {
          const linked = linkReplacement(d, replacement).replacement;
          get().updateProduct(replacement.key, { status: linked.status, verifications: linked.verifications, provisional: linked.provisional }, { by, reason: "Replacement linked — approval is not inherited" });
        }
      },

      supersede: (documentKey, replacementKey, by) => {
        set((st) => ({
          documentOverrides: {
            ...st.documentOverrides,
            [documentKey]: { ...(st.documentOverrides[documentKey] ?? {}), state: "superseded", supersededByKey: replacementKey },
          },
        }));
        const doc = get().documents().find((d) => d.key === documentKey);
        if (doc?.productKey) {
          get().updateProduct(doc.productKey, { status: "needs_review" }, { by, reason: `Document ${doc.documentId} superseded` });
        }
        get().log({ entity: "document", entityKey: documentKey, action: "supersede", reason: "Superseded by newer document", changedBy: by, safetyCritical: true, newValue: replacementKey });
      },

      addExtraction: (e) => set((st) => ({ extractions: [...st.extractions, e] })),
      confirmExtraction: (id, by) =>
        set((st) => ({ extractions: st.extractions.map((e) => (e.id === id ? { ...e, userConfirmed: true, confirmedBy: by } : e)) })),
      approveExtraction: (id, reviewer) =>
        set((st) => ({ extractions: st.extractions.map((e) => (e.id === id ? { ...e, reviewerApproved: true, reviewer } : e)) })),

      upsertInventory: (item) =>
        set((st) => ({
          inventory: st.inventory.some((i) => i.id === item.id)
            ? st.inventory.map((i) => (i.id === item.id ? item : i))
            : [...st.inventory, item],
        })),

      reset: () =>
        set({
          companyOverrides: {}, customCompanies: [], kitOverrides: {}, customKits: [],
          productOverrides: {}, customProducts: [], documentOverrides: {}, customDocuments: [],
          kitLinks: [...KIT_PRODUCTS], extractions: [], inventory: [], audit: [],
        }),
    }),
    { name: "sm-professional-products" },
  ),
);

/** Convenience: the current version of a product from the store. */
export const productCurrentVersion = currentVersion;
