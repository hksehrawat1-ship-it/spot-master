import { useParams } from "react-router-dom";
import StatusNotice from "@/components/system/StatusNotice";
import { COUNTRIES } from "@/data/countries";

type Doc = { title: string; description: string; body: React.ReactNode; draft?: boolean };

function Draft({ what }: { what: string }) {
  return (
    <StatusNotice tone="caution" title="Final legal wording required">
      The published {what} must be supplied by the operator of Stain Master. The summary below describes current
      practice and is not a substitute for the final legal text.
    </StatusNotice>
  );
}

const DOCS: Record<string, Doc> = {
  about: {
    title: "About Stain Master",
    description: "Stain Master is a safety-first spotting decision-support system for cleaning professionals.",
    body: (
      <>
        <p>
          Stain Master is a decision-support and safety-guidance system for dry cleaners and wet-cleaning operators.
          It combines stain identification, garment assessment, verified product information and staged treatment
          pathways into a single working instrument.
        </p>
        <p>
          Guidance is only shown when it is backed by an approved record. Where verified information is missing,
          Stain Master states this plainly rather than guessing.
        </p>
      </>
    ),
  },
  contact: {
    title: "Contact",
    description: "How to reach the Stain Master team for support and account questions.",
    body: <Draft what="support contact details" />,
    draft: true,
  },
  privacy: {
    title: "Privacy Policy",
    description: "How Stain Master collects, stores and protects professional account and case information.",
    body: (
      <>
        <Draft what="Privacy Policy" />
        <p>
          Account details, workspace preferences and stain cases are stored on protected servers and are visible only
          to the account that created them and to authorised administrators. Payment card details are never stored by
          Stain Master.
        </p>
      </>
    ),
    draft: true,
  },
  terms: {
    title: "Terms of Use",
    description: "The terms that govern professional access to Stain Master.",
    body: (
      <>
        <Draft what="Terms of Use" />
        <p>
          Stain Master provides guidance, not a guarantee. The operator remains responsible for every treatment
          decision taken on a customer garment.
        </p>
      </>
    ),
    draft: true,
  },
  refund: {
    title: "Refund Policy",
    description: "Refund and cancellation terms for Stain Master professional access.",
    body: <Draft what="Refund and cancellation policy" />,
    draft: true,
  },
  safety: {
    title: "Safety Disclaimer",
    description: "Stain Master is decision support. Fabric safety always takes priority.",
    body: (
      <>
        <StatusNotice tone="stop" title="Fabric safety takes priority over stain removal">
          Stain Master does not guarantee complete stain removal. Stop treatment whenever the garment shows colour
          loss, fibre damage or any unexpected reaction.
        </StatusNotice>
        <p>
          Always follow the current product label or technical data sheet, wear the protective equipment the product
          requires, and test in a concealed area before treating a visible area.
        </p>
      </>
    ),
  },
  countries: {
    title: "Supported countries",
    description: "Countries currently selectable for Stain Master accounts.",
    body: (
      <>
        <p>
          Stain Master accounts can be created in the countries listed below. Product availability differs by country
          and is shown per product.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-1 text-sm md:grid-cols-3">
          {COUNTRIES.map((c) => (
            <li key={c.code}>{c.name}</li>
          ))}
        </ul>
      </>
    ),
  },
};

export default function Legal() {
  const { slug = "about" } = useParams();
  const doc = DOCS[slug] ?? DOCS.about;

  return (
    <article className="sm-container max-w-3xl py-12">
      <h1>{doc.title}</h1>
      <p className="mt-2 text-muted-foreground">{doc.description}</p>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed">{doc.body}</div>
    </article>
  );
}
