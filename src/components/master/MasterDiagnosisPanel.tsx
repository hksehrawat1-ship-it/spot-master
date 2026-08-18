import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipGroup, PanelSection } from "@/components/master/MasterControls";
import {
  CONFIDENCE_FIELDS,
  CONFIDENCE_LEVELS,
  CONFIDENCE_NEVER_OVERRIDES,
  MARK_KINDS,
  NON_REMOVABLE_MESSAGE,
  ODOUR_SAFETY_NOTE,
  STAIN_CONDITIONS,
  STAIN_PHYSICAL_STATE,
} from "@/data/masterSpotter";
import { isRemovableMark } from "@/lib/masterEngine";
import { useMaster } from "@/store/useMaster";

const COMPONENT_OPTIONS = [
  "particulate", "oil", "wax", "protein", "tannin", "natural_dye", "synthetic_dye", "pigment", "resin", "metal", "sugar",
];

/** "Diagnosis" tab — advanced stain diagnosis and the evidence workspace inputs. */
export default function MasterDiagnosisPanel() {
  const { current, patchPath, toggleCondition, patchConfidence, patch } = useMaster();
  const d = current.diagnosis;
  const removable = isRemovableMark(d.markKind);

  return (
    <div className="space-y-4">
      <PanelSection
        title="What kind of mark is this?"
        description="Not every visible mark is removable soil."
        tone={removable ? "default" : "danger"}
      >
        <ChipGroup
          label="Mark classification"
          options={MARK_KINDS.map((m) => m.label)}
          value={MARK_KINDS.find((m) => m.key === d.markKind)?.label}
          onChange={(label) => {
            const found = MARK_KINDS.find((m) => m.label === label);
            if (found) patchPath("diagnosis", { markKind: found.key });
          }}
        />
        {!removable && <p className="text-xs font-semibold text-destructive">{NON_REMOVABLE_MESSAGE}</p>}
      </PanelSection>

      <PanelSection title="Stain identity">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" htmlFor="likely-identity">Likely stain identity</label>
            <Input
              id="likely-identity"
              value={d.likelyIdentity}
              onChange={(e) => {
                patchPath("diagnosis", { likelyIdentity: e.target.value });
                patch({ stainName: e.target.value });
              }}
              placeholder="For example: curry"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" htmlFor="alt-identity">Alternative identities</label>
            <Input
              id="alt-identity"
              value={d.alternativeIdentities.join(", ")}
              onChange={(e) =>
                patchPath("diagnosis", { alternativeIdentities: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
              }
              placeholder="Comma separated"
            />
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Components" description="Primary, secondary and tertiary components drive the sequence.">
        <div className="space-y-4">
          <ChipGroup label="Primary component" options={COMPONENT_OPTIONS} value={d.primaryComponent} onChange={(v) => patchPath("diagnosis", { primaryComponent: v })} />
          <ChipGroup label="Secondary component" options={COMPONENT_OPTIONS} value={d.secondaryComponent} onChange={(v) => patchPath("diagnosis", { secondaryComponent: v })} />
          <ChipGroup label="Tertiary component" options={COMPONENT_OPTIONS} value={d.tertiaryComponent} onChange={(v) => patchPath("diagnosis", { tertiaryComponent: v })} />
        </div>
      </PanelSection>

      <PanelSection title="Physical observation" description={ODOUR_SAFETY_NOTE}>
        <div className="space-y-4">
          <ChipGroup label="Physical state" options={STAIN_PHYSICAL_STATE} value={d.physicalState} onChange={(v) => patchPath("diagnosis", { physicalState: v })} />
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" htmlFor="stain-colour">Colour</label>
            <Input id="stain-colour" value={d.colour} onChange={(e) => patchPath("diagnosis", { colour: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold" htmlFor="odour">Odour observation (indirect)</label>
            <Input id="odour" value={d.odour} onChange={(e) => patchPath("diagnosis", { odour: e.target.value })} />
          </div>
          <ChipGroup label="Condition (select all that apply)" options={STAIN_CONDITIONS} multi values={d.conditions} onChange={toggleCondition} />
        </div>
      </PanelSection>

      <PanelSection title="Confidence" description={CONFIDENCE_NEVER_OVERRIDES}>
        <div className="space-y-4">
          {CONFIDENCE_FIELDS.map((f) => (
            <ChipGroup
              key={f.key}
              label={f.label}
              options={CONFIDENCE_LEVELS}
              value={current.evidencePanel.confidence[f.key]}
              onChange={(v) => patchConfidence(f.key, v)}
            />
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Missing information">
        <Textarea
          rows={3}
          value={current.evidencePanel.missingInformation.join("\n")}
          onChange={(e) =>
            patchPath("evidencePanel", { missingInformation: e.target.value.split("\n").filter((s) => s.trim()) })
          }
          placeholder="One item per line. Missing information keeps the case closed to new chemical stages."
        />
      </PanelSection>
    </div>
  );
}
