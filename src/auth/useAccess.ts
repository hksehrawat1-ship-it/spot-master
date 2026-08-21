/**
 * Shared frontend permission contract.
 *
 * Every product-domain screen must decide what to show through this hook so the
 * interface and the database agree exactly. Each field mirrors one database
 * helper function; the database still performs final enforcement.
 */

import { useMemo } from "react";
import { useAuth } from "@/auth/AuthProvider";
import {
  canEditProductDrafts,
  canPublishContent,
  canReadProductAudit,
  canReadProfessionalGuidance,
  canTechnicalApprove,
  isPlatformAdmin,
} from "@/lib/permissions";

export type AccessContract = {
  /** public.is_product_maintainer — read and edit draft product-domain records. */
  productDrafts: boolean;
  /** public.can_technical_approve — technically approve safety-critical content. */
  technicalApprove: boolean;
  /** public.can_publish_content — publish technically approved content. */
  publish: boolean;
  /** public.is_platform_admin — system administration. */
  platformAdmin: boolean;
  /** public.can_read_professional_guidance — approved professional guidance. */
  professionalGuidance: boolean;
  /** public.can_read_product_audit — product audit history. */
  productAudit: boolean;
  /** Roles could not be verified — screens must fail closed. */
  unverified: boolean;
};

export function accessForRoles(roles: readonly string[], unverified = false): AccessContract {
  if (unverified) {
    return {
      productDrafts: false,
      technicalApprove: false,
      publish: false,
      platformAdmin: false,
      professionalGuidance: false,
      productAudit: false,
      unverified: true,
    };
  }
  return {
    productDrafts: canEditProductDrafts(roles),
    technicalApprove: canTechnicalApprove(roles),
    publish: canPublishContent(roles),
    platformAdmin: isPlatformAdmin(roles),
    professionalGuidance: canReadProfessionalGuidance(roles),
    productAudit: canReadProductAudit(roles),
    unverified: false,
  };
}

export function useAccess(): AccessContract {
  const { roles, rolesLoaded, backendUnavailable } = useAuth();
  return useMemo(
    () => accessForRoles(roles, backendUnavailable || !rolesLoaded),
    [roles, rolesLoaded, backendUnavailable],
  );
}
