/**
 * Granular roles and least-privilege permission map (Constitution R16, R18).
 * Roles are read from the protected `user_roles` table only.
 */

export const APP_ROLES = [
  "owner",
  "administrator",
  "system_admin",
  "technical_reviewer",
  "content_admin",
  "content_editor",
  "translator",
  "auditor",
  "support",
  "professional_spotter",
  "dry_cleaner",
  "laundry_employee",
  "trainer",
  "learner",
  "domestic_user",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABEL: Record<AppRole, string> = {
  owner: "Owner",
  administrator: "Administrator",
  system_admin: "System administrator",
  technical_reviewer: "Technical reviewer",
  content_admin: "Content administrator",
  content_editor: "Content editor",
  translator: "Translator",
  auditor: "Auditor",
  support: "Support",
  professional_spotter: "Professional spotter",
  dry_cleaner: "Dry cleaner",
  laundry_employee: "Laundry employee",
  trainer: "Trainer",
  learner: "Learner",
  domestic_user: "Domestic user",
};

export const PERMISSIONS = [
  "admin.access",
  "admin.users.manage",
  "admin.organizations.manage",
  "admin.audit.read",
  "admin.system.manage",
  "content.draft.edit",
  "content.technical.approve",
  "content.publish",
  "content.translate",
  "products.manage",
  "safety.rules.manage",
  "safety.override.request",
  "outcomes.review",
  "support.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  owner: [...PERMISSIONS],
  administrator: [
    "admin.access", "admin.users.manage", "admin.organizations.manage", "admin.audit.read",
    "admin.system.manage", "content.draft.edit", "content.publish", "products.manage",
    "safety.rules.manage", "outcomes.review", "support.read",
  ],
  system_admin: [
    "admin.access", "admin.users.manage", "admin.organizations.manage", "admin.audit.read",
    "admin.system.manage", "support.read",
  ],
  technical_reviewer: [
    "admin.access", "content.draft.edit", "content.technical.approve", "outcomes.review",
    "safety.override.request",
  ],
  content_admin: ["admin.access", "content.draft.edit", "content.publish", "products.manage"],
  content_editor: ["admin.access", "content.draft.edit"],
  translator: ["admin.access", "content.translate"],
  auditor: ["admin.access", "admin.audit.read"],
  support: ["admin.access", "support.read"],
  professional_spotter: ["safety.override.request"],
  dry_cleaner: [],
  laundry_employee: [],
  trainer: [],
  learner: [],
  domestic_user: [],
};

export function permissionsForRoles(roles: readonly string[]): Permission[] {
  const set = new Set<Permission>();
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role as AppRole];
    if (perms) perms.forEach((p) => set.add(p));
  }
  return [...set];
}

export function hasPermission(roles: readonly string[], permission: Permission): boolean {
  return permissionsForRoles(roles).includes(permission);
}

export function canAccessAdmin(roles: readonly string[]): boolean {
  return hasPermission(roles, "admin.access");
}
