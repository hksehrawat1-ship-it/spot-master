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
  "products.guidance.read",
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
    "admin.audit.read", "safety.override.request",
  ],
  content_admin: ["admin.access", "content.draft.edit", "content.publish", "products.manage"],
  content_editor: ["admin.access", "content.draft.edit"],
  translator: ["admin.access", "content.translate"],
  auditor: ["admin.access", "admin.audit.read"],
  support: ["admin.access", "support.read"],
  professional_spotter: ["products.guidance.read", "safety.override.request"],
  dry_cleaner: ["products.guidance.read"],
  laundry_employee: ["products.guidance.read"],
  trainer: ["products.guidance.read"],
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

/* ------------------------------------------------------------------
 * Authoritative role contract — these lists mirror the database
 * helper functions exactly. The database remains the final authority;
 * these exist so the interface never offers an action the database
 * would reject, and never hides an action the database would allow.
 *
 *   product maintainers      -> public.is_product_maintainer()
 *   technical approvers      -> public.can_technical_approve()
 *   publishers               -> public.can_publish_content()
 *   platform administrators  -> public.is_platform_admin()
 *   professional readers     -> public.can_read_professional_guidance()
 *   product audit readers    -> public.can_read_product_audit()
 * ------------------------------------------------------------------ */

export const PRODUCT_MAINTAINER_ROLES: AppRole[] = [
  "owner", "administrator", "content_admin", "technical_reviewer", "content_editor",
];
export const TECHNICAL_APPROVER_ROLES: AppRole[] = ["owner", "technical_reviewer"];
export const PUBLISHER_ROLES: AppRole[] = ["owner", "administrator", "content_admin"];
export const PLATFORM_ADMIN_ROLES: AppRole[] = ["owner", "administrator", "system_admin"];
export const PROFESSIONAL_GUIDANCE_ROLES: AppRole[] = [
  "professional_spotter", "dry_cleaner", "laundry_employee", "trainer",
];
export const PRODUCT_AUDIT_ROLES: AppRole[] = [
  "owner", "administrator", "auditor", "technical_reviewer",
];

function anyRole(roles: readonly string[], allowed: readonly AppRole[]): boolean {
  return roles.some((r) => (allowed as readonly string[]).includes(r));
}

/** May read and edit draft product-domain records. */
export function canEditProductDrafts(roles: readonly string[]): boolean {
  return anyRole(roles, PRODUCT_MAINTAINER_ROLES);
}

/** May technically approve safety-critical product content. */
export function canTechnicalApprove(roles: readonly string[]): boolean {
  return anyRole(roles, TECHNICAL_APPROVER_ROLES);
}

/** May publish technically approved content. */
export function canPublishContent(roles: readonly string[]): boolean {
  return anyRole(roles, PUBLISHER_ROLES);
}

/** May reach system administration. */
export function isPlatformAdmin(roles: readonly string[]): boolean {
  return anyRole(roles, PLATFORM_ADMIN_ROLES);
}

/** May read approved and verified professional product guidance. */
export function canReadProfessionalGuidance(roles: readonly string[]): boolean {
  return anyRole(roles, PROFESSIONAL_GUIDANCE_ROLES) || canEditProductDrafts(roles);
}

/** May read product audit history. */
export function canReadProductAudit(roles: readonly string[]): boolean {
  return anyRole(roles, PRODUCT_AUDIT_ROLES);
}

