import { Textarea } from "@/components/ui/textarea";
import { ChipGroup, PanelSection } from "@/components/master/MasterControls";
import {
  APPROVED_SAMPLING_LOCATIONS,
  CONSTRUCTION_OPTIONS,
  DESTRUCTIVE_TEST_WARNING,
  DYE_COLOUR_OPTIONS,
  DYE_RISK_FLAGS,
  FIBRE_CATEGORIES,
  FIBRE_CERTAINTY,
  FIBRE_IDENTIFICATION_METHODS,
  GARMENT_IDENTITY_QUESTIONS,
  MOST_SENSITIVE_COMPONENT_NOTE,
  TRIMS_AND_FINISHES,
} from "@/data/masterSpotter";
import { mostSensitiveComponent } from "@/lib/masterEngine";
import { useMaster } from "@/store/useMaster";

/** Left panel / "Case" tab — advanced intake. All Retail and Professional answers are retained. */
export default function MasterCasePanel() {
  const { current, patchIdentity, patchPath, toggleConstruction, toggleTrim, patchDyeFlag, patch } = useMaster();
  const sensitive = mostSensitiveComponent(current);
  const destructive = FIBRE_IDENTIFICATION_METHODS.find((m) => m.label === current.fibreAssessment.identifiedBy)?.destructive;

  return (
    <div className="space-y-4">
      <PanelSection title="Garment identity" description="Carried forward from the earlier working level where already recorded.">
        <div className="space-y-4">
          {GARMENT_IDENTITY_QUESTIONS.map((q) => (
            <ChipGroup
              key={q.key}
              label={q.label}
              options={q.options}
              value={current.garmentIdentity[q.key]}
              onChange={(v) => patchIdentity(q.key, v)}
            />
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Fibre assessment">
        <div className="space-y-4">
          <ChipGroup
            label="Identification certainty"
            options={FIBRE_CERTAINTY}
            value={current.fibreAssessment.certainty}
            onChange={(v) => patchPath("fibreAssessment", { certainty: v })}
          />
          <ChipGroup
            label="Fibre category"
            options={FIBRE_CATEGORIES}
            value={current.fibreAssessment.category}
            onChange={(v) => patchPath("fibreAssessment", { category: v })}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" htmlFor="fibre-named">
              Named fibre / blend and percentage composition, when known
            </label>
            <Textarea
              id="fibre-named"
              rows={2}
              value={current.fibreAssessment.composition}
              onChange={(e) => patchPath("fibreAssessment", { composition: e.target.value, named: e.target.value })}
              placeholder="For example: 60% cotton, 40% polyester (care label)"
            />
          </div>
          <ChipGroup
            label="How was the fibre identified?"
            options={FIBRE_IDENTIFICATION_METHODS.map((m) => m.label)}
            value={current.fibreAssessment.identifiedBy}
            onChange={(v) => patchPath("fibreAssessment", { identifiedBy: v })}
          />
          {destructive && (
            <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-xs font-semibold text-destructive">{DESTRUCTIVE_TEST_WARNING}</p>
              <ChipGroup
                label="Approved sampling location"
                options={APPROVED_SAMPLING_LOCATIONS}
                value={current.fibreAssessment.samplingLocation}
                onChange={(v) => patchPath("fibreAssessment", { samplingLocation: v, samplingAuthorised: true })}
              />
            </div>
          )}
        </div>
      </PanelSection>

      <PanelSection title="Construction assessment">
        <ChipGroup
          label="Construction (select all that apply)"
          options={CONSTRUCTION_OPTIONS}
          multi
          values={current.constructionTypes}
          onChange={toggleConstruction}
        />
      </PanelSection>

      <PanelSection title="Dye and colour assessment">
        <div className="space-y-4">
          <ChipGroup
            label="Colour and colouration method"
            options={DYE_COLOUR_OPTIONS}
            value={current.dyeColour.method}
            onChange={(v) => patchPath("dyeColour", { method: v })}
          />
          {DYE_RISK_FLAGS.map((f) => (
            <ChipGroup
              key={f.key}
              label={f.label}
              options={f.options}
              value={current.dyeColour.flags[f.key]}
              onChange={(v) => {
                patchDyeFlag(f.key, v);
                if (f.key === "bleeding") patch({ activeColourBleeding: v === "Yes" ? "Yes" : v === "No" ? "No" : "Not sure" });
              }}
            />
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Trims and finishes" description={MOST_SENSITIVE_COMPONENT_NOTE}>
        <div className="space-y-3">
          <ChipGroup
            label="Present on this garment"
            options={TRIMS_AND_FINISHES.map((t) => t.label)}
            multi
            values={current.trims.map((k) => TRIMS_AND_FINISHES.find((t) => t.key === k)?.label ?? k)}
            onChange={(label) => {
              const found = TRIMS_AND_FINISHES.find((t) => t.label === label);
              if (found) toggleTrim(found.key);
            }}
          />
          <p className="rounded-lg bg-muted p-3 text-xs font-semibold">
            Safety decision follows: {sensitive.label}
            {sensitive.sensitive ? " (most sensitive component)" : ""}
          </p>
        </div>
      </PanelSection>

      <PanelSection title="Operator notes">
        <Textarea
          rows={3}
          value={current.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Case notes. Operator observations are never published as guidance."
        />
      </PanelSection>
    </div>
  );
}
