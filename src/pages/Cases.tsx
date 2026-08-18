import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { LoadingState } from "@/components/system/StatusStates";
import StatusNotice from "@/components/system/StatusNotice";

type CaseRow = {
  id: string;
  case_reference: string;
  working_level: string;
  outcome: string | null;
  updated_at: string;
};

export default function Cases() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CaseRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("master_cases")
        .select("id, case_reference, working_level, outcome, updated_at")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (error) {
        setFailed(true);
        setRows([]);
        return;
      }
      setRows(data as CaseRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (rows === null) return <LoadingState label="Loading your cases…" />;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1>Your cases</h1>
          <p className="mt-1 text-muted-foreground">Cases you have recorded on this account.</p>
        </div>
        <Link to="/cases/new" className="sm-btn-primary">
          <PlusCircle aria-hidden className="h-4 w-4" /> New case
        </Link>
      </header>

      {failed && (
        <StatusNotice tone="stop" title="We could not load your cases">
          Please check your connection and try again.
        </StatusNotice>
      )}

      {!failed && rows.length === 0 ? (
        <div className="sm-card text-center">
          <FolderOpen aria-hidden className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No cases recorded yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a case to keep the garment assessment, testing and outcome together.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => (
            <li key={c.id} className="sm-card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-navy">{c.case_reference}</p>
                <p className="text-sm text-muted-foreground">
                  {c.working_level} · updated {new Date(c.updated_at).toLocaleDateString()}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">{c.outcome ?? "In progress"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
