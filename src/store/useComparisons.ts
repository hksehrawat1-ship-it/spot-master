/** STEP 13 — comparison governance store: snapshots, trials, prices, approvals and audit. */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  SEED_TRIALS, SEED_PRICES, formatComparisonId, formatTrialId, formatPriceId,
  RANK_DISPLAY_STATUSES,
} from "@/data/kitComparison";
import type {
  ComparisonAudit, ComparisonReviewTrigger, ComparisonSnapshot, ComparisonStatus,
  PerformanceTrial, PriceRecord, SustainabilityFields,
} from "@/data/kitComparison";
import { applyComparisonTrigger } from "@/lib/comparisonEngine";

export type StoredComparison = {
  comparisonId: string;
  status: ComparisonStatus;
  snapshot: ComparisonSnapshot;
  justification?: string;
  reviewer?: string;
  createdAt: string;
  updatedAt: string;
  reviewDate?: string;
};

type State = {
  comparisons: StoredComparison[];
  trials: PerformanceTrial[];
  prices: PriceRecord[];
  sustainability: Record<string, SustainabilityFields>;
  audit: ComparisonAudit[];

  nextComparisonId: () => string;
  saveComparison: (snapshot: ComparisonSnapshot, status: ComparisonStatus, by: string) => StoredComparison;
  setStatus: (
    comparisonId: string,
    status: ComparisonStatus,
    opts: { by: string; justification: string },
  ) => { ok: boolean; message: string };
  addTrial: (trial: Omit<PerformanceTrial, "testId">, by: string) => PerformanceTrial;
  addPrice: (price: Omit<PriceRecord, "priceId">, by: string) => PriceRecord;
  setSustainability: (productKey: string, fields: SustainabilityFields, by: string) => void;
  trigger: (comparisonId: string, t: ComparisonReviewTrigger, by: string) => string;
  log: (e: Omit<ComparisonAudit, "id" | "at">) => void;
  reset: () => void;
};

const now = () => new Date().toISOString();

export const useComparisons = create<State>()(
  persist(
    (set, get) => ({
      comparisons: [],
      trials: [...SEED_TRIALS],
      prices: [...SEED_PRICES],
      sustainability: {},
      audit: [],

      nextComparisonId: () => formatComparisonId(get().comparisons.length + 1),

      log: (e) =>
        set((st) => ({
          audit: [{ id: `ca${st.audit.length + 1}`, at: now(), ...e }, ...st.audit].slice(0, 500),
        })),

      saveComparison: (snapshot, status, by) => {
        const rec: StoredComparison = {
          comparisonId: snapshot.comparisonId,
          status,
          snapshot,
          reviewer: snapshot.reviewer,
          createdAt: now(),
          updatedAt: now(),
        };
        set((st) => ({ comparisons: [rec, ...st.comparisons.filter((c) => c.comparisonId !== rec.comparisonId)] }));
        get().log({
          comparisonId: rec.comparisonId, user: by, action: "create",
          reason: "Comparison snapshot stored", newValue: status, rankingImpact: false,
        });
        return rec;
      },

      setStatus: (comparisonId, status, { by, justification }) => {
        // A final rank may never be approved without a written justification (§33).
        if (RANK_DISPLAY_STATUSES.includes(status) && !justification.trim())
          return { ok: false, message: "A written justification is required before a final ranking is approved." };
        const before = get().comparisons.find((c) => c.comparisonId === comparisonId);
        if (!before) return { ok: false, message: "Comparison not found." };
        set((st) => ({
          comparisons: st.comparisons.map((c) =>
            c.comparisonId === comparisonId ? { ...c, status, justification, reviewer: by, updatedAt: now() } : c),
        }));
        get().log({
          comparisonId, user: by, action: "status_change", field: "status",
          previousValue: before.status, newValue: status, reason: justification,
          reviewer: by, approval: status, rankingImpact: true,
        });
        return { ok: true, message: `Comparison marked ${status.replace(/_/g, " ")}.` };
      },

      addTrial: (trial, by) => {
        const full: PerformanceTrial = { ...trial, testId: formatTrialId(get().trials.length + 1) };
        set((st) => ({ trials: [...st.trials, full] }));
        get().log({
          comparisonId: "—", user: by, action: "add_trial", reason: "Controlled performance trial recorded",
          newValue: `${full.testId} ${full.result}`, source: full.method, rankingImpact: true,
        });
        return full;
      },

      addPrice: (price, by) => {
        const full: PriceRecord = { ...price, priceId: formatPriceId(get().prices.length + 1) };
        set((st) => ({ prices: [...st.prices, full] }));
        get().log({
          comparisonId: "—", user: by, action: "add_price", reason: "Price record added",
          newValue: `${full.priceId}`, source: full.source, rankingImpact: true,
        });
        return full;
      },

      setSustainability: (productKey, fields, by) => {
        set((st) => ({ sustainability: { ...st.sustainability, [productKey]: fields } }));
        get().log({
          comparisonId: "—", user: by, action: "sustainability", reason: "Evidence-based sustainability fields recorded",
          newValue: fields.evidenceLevel, rankingImpact: false,
        });
      },

      trigger: (comparisonId, t, by) => {
        const rec = get().comparisons.find((c) => c.comparisonId === comparisonId);
        if (!rec) return "Comparison not found.";
        const outcome = applyComparisonTrigger(rec.snapshot, t);
        set((st) => ({
          comparisons: st.comparisons.map((c) =>
            c.comparisonId === comparisonId ? { ...c, status: outcome.status, updatedAt: now() } : c),
        }));
        get().log({
          comparisonId, user: by, action: "review_trigger", field: "status",
          previousValue: rec.status, newValue: outcome.status, reason: outcome.note,
          rankingImpact: outcome.rankSuspended,
        });
        return outcome.note;
      },

      reset: () => set({ comparisons: [], trials: [...SEED_TRIALS], prices: [...SEED_PRICES], sustainability: {}, audit: [] }),
    }),
    { name: "sm-comparisons-v1" },
  ),
);
