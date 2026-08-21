/**
 * Shared in-page permission gate.
 *
 * Screens use this instead of ad-hoc role checks so the interface can never
 * show an action the database would reject. The database still enforces.
 */

import { Card } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { useAccess, type AccessContract } from "@/auth/useAccess";

type Capability = Exclude<keyof AccessContract, "unverified">;

const CAPABILITY_LABEL: Record<Capability, string> = {
  productDrafts: "edit draft product information",
  technicalApprove: "technically approve product content",
  publish: "publish approved content",
  platformAdmin: "use system administration",
  professionalGuidance: "view approved professional guidance",
  productAudit: "read product audit history",
};

export function RequireAccess({
  capability,
  children,
}: {
  capability: Capability;
  children: React.ReactNode;
}) {
  const access = useAccess();
  if (access[capability]) return <>{children}</>;

  return (
    <div className="p-4 pb-24">
      <Card className="space-y-1 border-amber-500/40 p-4">
        <div className="flex items-center gap-2 text-amber-600">
          <ShieldAlert className="h-4 w-4" />
          <p className="text-sm font-semibold">Permission required</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {access.unverified
            ? "Your permissions could not be confirmed, so this area is closed."
            : `Your role does not permit you to ${CAPABILITY_LABEL[capability]}.`}
        </p>
      </Card>
    </div>
  );
}

export default RequireAccess;
