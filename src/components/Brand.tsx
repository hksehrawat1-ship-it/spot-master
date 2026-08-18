import { Link } from "react-router-dom";
import logo from "@/assets/stain-master-mark.png";

export default function Brand({ to = "/", subdued = false }: { to?: string; subdued?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="Stain Master home">
      <img src={logo} alt="" aria-hidden width={36} height={36} className="h-9 w-9 object-contain" />
      <span className="leading-tight">
        <span className="block text-[17px] font-bold text-navy">Stain Master</span>
        {!subdued && (
          <span className="block text-[11px] font-medium text-muted-foreground">
            Professional spotting guidance
          </span>
        )}
      </span>
    </Link>
  );
}
