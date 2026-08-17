import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { canAccessAdmin, hasPermission, type Permission } from "@/lib/permissions";
import { AccessDeniedState, LoadingState, OfflineState, SignInRequiredState } from "@/components/system/StatusStates";

type Props = {
  /** Permission required to view the route. Defaults to plain admin access. */
  permission?: Permission;
  /** Any of these permissions is sufficient. */
  anyOf?: Permission[];
  /** When true, unauthenticated visitors are redirected instead of shown a panel. */
  redirectToSignIn?: boolean;
  label?: string;
  children?: React.ReactNode;
};

/**
 * The single protected-route gate for every /admin route (Constitution R18).
 * Protected content is never rendered before authorisation is confirmed.
 */
export default function ProtectedRoute({
  permission = "admin.access",
  anyOf,
  redirectToSignIn = true,
  label = "this area",
  children,
}: Props) {
  const { status, roles, rolesLoaded, backendUnavailable } = useAuth();
  const location = useLocation();

  if (status === "loading" || (status === "signed_in" && !rolesLoaded)) {
    return <LoadingState />;
  }

  if (status === "unavailable") return <OfflineState onRetry={() => window.location.reload()} />;

  if (status === "signed_out") {
    return redirectToSignIn ? (
      <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
    ) : (
      <SignInRequiredState />
    );
  }

  // Roles could not be verified — fail closed rather than guessing.
  if (backendUnavailable) return <OfflineState onRetry={() => window.location.reload()} />;

  const permitted = anyOf
    ? anyOf.some((p) => hasPermission(roles, p))
    : hasPermission(roles, permission) || (permission === "admin.access" && canAccessAdmin(roles));

  if (!permitted) return <AccessDeniedState what={label} />;

  return <>{children ?? <Outlet />}</>;
}

/** Lighter gate for signed-in but non-admin areas (account, saved cases). */
export function RequireSignIn({ children }: { children?: React.ReactNode }) {
  const { status, backendUnavailable } = useAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingState label="Loading…" />;
  if (status === "unavailable" || backendUnavailable) return <OfflineState onRetry={() => window.location.reload()} />;
  if (status === "signed_out") return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  return <>{children ?? <Outlet />}</>;
}
