import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import StatusNotice from "@/components/system/StatusNotice";

export default function Account() {
  const navigate = useNavigate();
  const { user, roles, isAdmin, signOut } = useAuth();

  return (
    <div className="sm-container max-w-2xl py-8">
      <h1>Account</h1>
      <p className="mt-2 text-muted-foreground">Your sign-in details and workspace settings.</p>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="mt-1 font-medium">{user?.email ?? "—"}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          Access level: {roles.length ? roles.join(", ") : "domestic user"}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link to="/setup" className="sm-btn-secondary text-center">
          Workspace setup
        </Link>
        <Link to="/cases" className="sm-btn-secondary text-center">
          My cases
        </Link>
        {isAdmin && (
          <Link to="/admin" className="sm-btn-secondary text-center">
            Administration
          </Link>
        )}
        <button
          type="button"
          className="sm-btn-primary"
          onClick={async () => {
            await signOut();
            toast.success("Signed out.");
            navigate("/", { replace: true });
          }}
        >
          Sign out
        </button>
      </div>

      <StatusNotice tone="info" className="mt-8" title="Access levels are set by an administrator">
        Administration areas remain protected after sign-in.
      </StatusNotice>
    </div>
  );
}
