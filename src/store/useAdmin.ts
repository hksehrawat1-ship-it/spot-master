/** STEP 16 — administration workspace store (users, orgs, inventory, training, countries, imports). */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  SEED_ADMIN_USERS, SEED_COUNTRIES, SEED_INVENTORY, SEED_ORGANIZATIONS,
  SEED_SETUP_TASKS, SEED_TRAINING,
} from "@/data/adminWorkspace";
import type {
  AdminMode, AdminOrganization, AdminUser, CountryConfig, HighImpactAction,
  ImportKind, InventoryItem, SetupTask, TrainingModule,
} from "@/data/adminWorkspace";
import type { GovRole } from "@/data/governance";
import {
  bufferDraft, canChangeUserRoles, confirmHighImpact, importCreatesStatus, validateImport,
} from "@/lib/adminEngine";
import type { DraftBuffer, ImportPreview, ImportRow } from "@/lib/adminEngine";

const now = () => new Date().toISOString();

export type AdminAudit = {
  id: string;
  at: string;
  actor: string;
  action: string;
  target?: string;
  reason?: string;
  immutable: true;
};

export type ImportBatch = {
  batchId: string;
  kind: ImportKind;
  at: string;
  by: string;
  accepted: number;
  rejected: number;
  createdStatus: "draft";
  issues: ImportPreview["issues"];
};

export type ReviewComment = {
  commentId: string;
  recordId: string;
  version: string;
  anchor: string;                 // field, claim, document, step, rule, factor
  author: string;
  body: string;
  status: "open" | "addressed" | "resolved" | "reopened";
  at: string;
};

type State = {
  currentUserId: string;
  mode: AdminMode;
  users: AdminUser[];
  organizations: AdminOrganization[];
  inventory: InventoryItem[];
  training: TrainingModule[];
  countries: CountryConfig[];
  setupTasks: SetupTask[];
  imports: ImportBatch[];
  comments: ReviewComment[];
  drafts: DraftBuffer[];
  audit: AdminAudit[];
  permissionDenials: number;
  safetyEngineAvailable: boolean;

  setCurrentUser: (userId: string) => void;
  setMode: (mode: AdminMode) => void;
  log: (action: string, target?: string, reason?: string) => void;
  denyAccess: (what: string) => void;

  setUserRoles: (actorId: string, targetId: string, roles: GovRole[], reason: string) =>
    { ok: boolean; message: string };
  suspendUser: (actorId: string, targetId: string, reason: string, confirmed: boolean) =>
    { ok: boolean; message: string };
  inviteUser: (user: AdminUser, by: string) => void;

  upsertOrganization: (org: AdminOrganization, by: string) => void;
  upsertInventory: (item: InventoryItem, by: string) => void;
  upsertTraining: (mod: TrainingModule, by: string) => void;
  upsertCountry: (c: CountryConfig, by: string) => void;
  closeSetupTask: (taskId: string, by: string, reason: string) => { ok: boolean; message: string };

  previewImport: (kind: ImportKind, columns: string[], rows: ImportRow[], existingKeys?: string[]) => ImportPreview;
  commitImport: (preview: ImportPreview, by: string) => ImportBatch;

  addComment: (c: Omit<ReviewComment, "commentId" | "at" | "status">) => ReviewComment;
  setCommentStatus: (commentId: string, status: ReviewComment["status"]) => void;

  saveDraft: (key: string, payload: Record<string, unknown>) => void;
  clearDraft: (key: string) => void;

  confirmAction: (action: HighImpactAction, reason: string, confirmed: boolean, actor: string, target?: string) =>
    { ok: boolean; message: string };
  setSafetyEngineAvailable: (v: boolean) => void;
  reset: () => void;
};

const seed = () => ({
  currentUserId: "usr-sysadmin",
  mode: "system" as AdminMode,
  users: SEED_ADMIN_USERS,
  organizations: SEED_ORGANIZATIONS,
  inventory: SEED_INVENTORY,
  training: SEED_TRAINING,
  countries: SEED_COUNTRIES,
  setupTasks: SEED_SETUP_TASKS,
  imports: [] as ImportBatch[],
  comments: [] as ReviewComment[],
  drafts: [] as DraftBuffer[],
  audit: [] as AdminAudit[],
  permissionDenials: 0,
  safetyEngineAvailable: true,
});

export const useAdmin = create<State>()(
  persist(
    (set, get) => ({
      ...seed(),

      setCurrentUser: (userId) => {
        const user = get().users.find((u) => u.userId === userId);
        set({ currentUserId: userId, mode: user?.modes[0] ?? "content" });
      },
      setMode: (mode) => set({ mode }),

      log: (action, target, reason) =>
        set((s) => ({
          audit: [
            { id: `adm-${s.audit.length + 1}`, at: now(), actor: s.currentUserId, action, target, reason, immutable: true },
            ...s.audit,
          ],
        })),

      denyAccess: (what) => {
        set((s) => ({ permissionDenials: s.permissionDenials + 1 }));
        get().log("access_denied", what);
      },

      setUserRoles: (actorId, targetId, roles, reason) => {
        const { users } = get();
        const actor = users.find((u) => u.userId === actorId);
        const target = users.find((u) => u.userId === targetId);
        if (!actor || !target) return { ok: false, message: "User not found." };
        const allowed = canChangeUserRoles(actor, target);
        if (!allowed.ok) {
          get().denyAccess(`role_change:${targetId}`);
          return allowed;
        }
        const confirm = confirmHighImpact("suspend_user", reason, true);
        if (!confirm.ok) return { ok: false, message: "A written reason is required for a role change." };
        set({ users: users.map((u) => (u.userId === targetId ? { ...u, roles } : u)) });
        get().log("user_roles_changed", targetId, reason);
        return { ok: true, message: "Roles updated." };
      },

      suspendUser: (actorId, targetId, reason, confirmed) => {
        const actor = get().users.find((u) => u.userId === actorId);
        if (!actor?.roles.includes("system_administrator")) {
          get().denyAccess(`suspend_user:${targetId}`);
          return { ok: false, message: "Only a system administrator may suspend a user." };
        }
        const check = confirmHighImpact("suspend_user", reason, confirmed);
        if (!check.ok) return check;
        set((s) => ({ users: s.users.map((u) => (u.userId === targetId ? { ...u, status: "suspended" } : u)) }));
        get().log("user_suspended", targetId, reason);
        return { ok: true, message: "User suspended. Protected access is blocked." };
      },

      inviteUser: (user, by) => {
        set((s) => ({ users: [...s.users, { ...user, status: "invited" }] }));
        get().log("user_invited", user.userId, `Invited by ${by}`);
      },

      upsertOrganization: (org, by) => {
        set((s) => ({
          organizations: s.organizations.some((o) => o.organizationId === org.organizationId)
            ? s.organizations.map((o) => (o.organizationId === org.organizationId ? org : o))
            : [...s.organizations, org],
        }));
        get().log("organization_saved", org.organizationId, `By ${by}`);
      },

      upsertInventory: (item, by) => {
        set((s) => ({
          inventory: s.inventory.some((i) => i.itemId === item.itemId)
            ? s.inventory.map((i) => (i.itemId === item.itemId ? item : i))
            : [...s.inventory, item],
        }));
        get().log("inventory_saved", item.itemId, `By ${by} — verification status unchanged`);
      },

      upsertTraining: (mod, by) => {
        set((s) => ({
          training: s.training.some((t) => t.moduleId === mod.moduleId)
            ? s.training.map((t) => (t.moduleId === mod.moduleId ? mod : t))
            : [...s.training, mod],
        }));
        get().log("training_saved", mod.moduleId, `By ${by}`);
      },

      upsertCountry: (c, by) => {
        set((s) => ({
          countries: s.countries.some((x) => x.code === c.code)
            ? s.countries.map((x) => (x.code === c.code ? c : x))
            : [...s.countries, c],
        }));
        get().log("country_saved", c.code, `By ${by}`);
      },

      closeSetupTask: (taskId, by, reason) => {
        if (reason.trim().length < 12) return { ok: false, message: "Explain how the task was resolved." };
        set((s) => ({ setupTasks: s.setupTasks.map((t) => (t.taskId === taskId ? { ...t, open: false } : t)) }));
        get().log("setup_task_closed", taskId, `${by}: ${reason}`);
        return { ok: true, message: "Task closed." };
      },

      previewImport: (kind, columns, rows, existingKeys = []) =>
        validateImport(kind, columns, rows, existingKeys),

      commitImport: (preview, by) => {
        const batch: ImportBatch = {
          batchId: `imp-${get().imports.length + 1}`,
          kind: preview.kind,
          at: now(),
          by,
          accepted: preview.createRows.length,
          rejected: preview.issues.filter((i) => i.row > 0).length + preview.duplicates.length,
          createdStatus: importCreatesStatus() as "draft",
          issues: preview.issues,
        };
        set((s) => ({ imports: [batch, ...s.imports] }));
        get().log("bulk_import", batch.batchId, `${batch.accepted} draft record(s) created`);
        return batch;
      },

      addComment: (c) => {
        const comment: ReviewComment = {
          ...c,
          commentId: `cmt-${get().comments.length + 1}`,
          status: "open",
          at: now(),
        };
        set((s) => ({ comments: [comment, ...s.comments] }));
        return comment;
      },

      setCommentStatus: (commentId, status) =>
        set((s) => ({ comments: s.comments.map((c) => (c.commentId === commentId ? { ...c, status } : c)) })),

      saveDraft: (key, payload) =>
        set((s) => ({ drafts: [bufferDraft(key, payload), ...s.drafts.filter((d) => d.key !== key)] })),

      clearDraft: (key) => set((s) => ({ drafts: s.drafts.filter((d) => d.key !== key) })),

      confirmAction: (action, reason, confirmed, actor, target) => {
        const check = confirmHighImpact(action, reason, confirmed);
        if (check.ok) {
          set((s) => ({
            audit: [
              { id: `adm-${s.audit.length + 1}`, at: now(), actor, action, target, reason, immutable: true },
              ...s.audit,
            ],
          }));
        }
        return check;
      },

      setSafetyEngineAvailable: (v) => set({ safetyEngineAvailable: v }),

      reset: () => set({ ...seed() }),
    }),
    { name: "stain-master-admin-v1" },
  ),
);

export const currentAdminUser = (s: State) =>
  s.users.find((u) => u.userId === s.currentUserId) ?? s.users[0];
