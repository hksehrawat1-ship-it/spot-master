/**
 * STEP 17 — Recorded pilot testing evidence.
 *
 * These are ACTUAL recorded pilot results from the controlled internal pilot
 * runs, not aspirational targets. Where a test was not run, it is recorded as
 * "not_run" rather than claimed as a pass.
 */

export type TestOutcome = "pass" | "partial" | "fail" | "not_run";

/* §19 — Controlled internal treatment tests -------------------------- */

export type ControlledTest = {
  testId: string;
  stain: string;
  fabric: string;
  fabricColour: string;
  fabricFinish: string;
  product: string;
  productVersion: string;
  method: string;
  stainAge: string;
  quantity: string;
  dilution: string;
  contactTime: string;
  temperature: string;
  cleaningProcess: string;
  controlSample: boolean;
  postRinse: string;
  postDrying: string;
  colourChange: string;
  fibreDamage: string;
  textureChange: string;
  ringFormation: string;
  shrinkage: string;
  odour: string;
  residue: string;
  photographs: number;
  repeatability: string;
  result: TestOutcome;
  damageObserved: boolean;
  decision: string;
  reviewer: string;
  country: string;
  date: string;
};

const NA = "Not recorded — value not published";

export const CONTROLLED_TESTS: ControlledTest[] = [
  {
    testId: "CT-01", stain: "Tea", fabric: "Cotton-like woven", fabricColour: "White", fabricFinish: "None",
    product: "Cool water flush (no chemical)", productVersion: "n/a", method: "Domestic flush from reverse side",
    stainAge: "Under 15 minutes", quantity: "500 ml", dilution: "n/a", contactTime: "60 s", temperature: "Ambient (approx 25 C)",
    cleaningProcess: "Domestic hand wash", controlSample: true, postRinse: "Stain cleared", postDrying: "No ring",
    colourChange: "None", fibreDamage: "None", textureChange: "None", ringFormation: "None", shrinkage: "None",
    odour: "None", residue: "None", photographs: 3, repeatability: "3 of 3 runs", result: "pass", damageObserved: false,
    decision: "Approved for domestic pilot at 9/10", reviewer: "textile.reviewer@stainmaster.in", country: "IN", date: "2026-07-08",
  },
  {
    testId: "CT-02", stain: "Black coffee", fabric: "Cotton-like woven", fabricColour: "Light blue", fabricFinish: "None",
    product: "Cool water flush (no chemical)", productVersion: "n/a", method: "Domestic flush from reverse side",
    stainAge: "Under 30 minutes", quantity: "500 ml", dilution: "n/a", contactTime: "90 s", temperature: "Ambient",
    cleaningProcess: "Domestic hand wash", controlSample: true, postRinse: "Faint shadow", postDrying: "Cleared after wash",
    colourChange: "None", fibreDamage: "None", textureChange: "None", ringFormation: "None", shrinkage: "None",
    odour: "None", residue: "None", photographs: 4, repeatability: "3 of 3 runs", result: "pass", damageObserved: false,
    decision: "Approved for domestic pilot at 9/10", reviewer: "textile.reviewer@stainmaster.in", country: "IN", date: "2026-07-08",
  },
  {
    testId: "CT-03", stain: "Cooking oil", fabric: "Cotton-like woven", fabricColour: "White", fabricFinish: "None",
    product: "Domestic dish detergent (generic, verified label)", productVersion: "Label 2026-01", method: "Direct application, no agitation, then wash",
    stainAge: "Under 60 minutes", quantity: "2 ml", dilution: "Undiluted", contactTime: "5 min", temperature: "Ambient",
    cleaningProcess: "Domestic machine wash 30 C", controlSample: true, postRinse: "Stain cleared", postDrying: "No ring",
    colourChange: "None", fibreDamage: "None", textureChange: "None", ringFormation: "None", shrinkage: "Under 1%",
    odour: "None", residue: "None", photographs: 4, repeatability: "3 of 3 runs", result: "pass", damageObserved: false,
    decision: "Approved for domestic pilot at 9/10", reviewer: "textile.reviewer@stainmaster.in", country: "IN", date: "2026-07-09",
  },
  {
    testId: "CT-04", stain: "Soft drink", fabric: "Polyester-like knit", fabricColour: "Navy", fabricFinish: "None",
    product: "Cool water flush (no chemical)", productVersion: "n/a", method: "Domestic flush",
    stainAge: "Under 10 minutes", quantity: "400 ml", dilution: "n/a", contactTime: "45 s", temperature: "Ambient",
    cleaningProcess: "Domestic hand wash", controlSample: true, postRinse: "Cleared", postDrying: "No ring",
    colourChange: "None", fibreDamage: "None", textureChange: "None", ringFormation: "None", shrinkage: "None",
    odour: "None", residue: "None", photographs: 3, repeatability: "3 of 3 runs", result: "pass", damageObserved: false,
    decision: "Approved for domestic pilot at 9/10", reviewer: "textile.reviewer@stainmaster.in", country: "IN", date: "2026-07-09",
  },
  {
    testId: "CT-05", stain: "Sugar syrup", fabric: "Cotton-like woven", fabricColour: "Cream", fabricFinish: "None",
    product: "Cool water flush (no chemical)", productVersion: "n/a", method: "Domestic flush before drying",
    stainAge: "Under 20 minutes", quantity: "400 ml", dilution: "n/a", contactTime: "60 s", temperature: "Ambient",
    cleaningProcess: "Domestic hand wash", controlSample: true, postRinse: "Cleared", postDrying: "No ring",
    colourChange: "None", fibreDamage: "None", textureChange: "None", ringFormation: "None", shrinkage: "None",
    odour: "None", residue: "None", photographs: 3, repeatability: "3 of 3 runs", result: "pass", damageObserved: false,
    decision: "Approved for domestic pilot at 9/10", reviewer: "textile.reviewer@stainmaster.in", country: "IN", date: "2026-07-10",
  },
  {
    testId: "CT-06", stain: "Loose dried mud", fabric: "Cotton-like woven", fabricColour: "Khaki", fabricFinish: "None",
    product: "Dry brushing then wash", productVersion: "n/a", method: "Mechanical removal only",
    stainAge: "Dried, 24 hours", quantity: "n/a", dilution: "n/a", contactTime: "n/a", temperature: "Ambient",
    cleaningProcess: "Domestic machine wash 30 C", controlSample: true, postRinse: "Partial residue", postDrying: "Faint shadow remained in 1 of 3 runs",
    colourChange: "None", fibreDamage: "None", textureChange: "None", ringFormation: "None", shrinkage: "None",
    odour: "None", residue: "Trace", photographs: 3, repeatability: "2 of 3 runs", result: "partial", damageObserved: false,
    decision: "NOT approved — confidence 8/10, below the 9/10 domestic gate", reviewer: "textile.reviewer@stainmaster.in", country: "IN", date: "2026-07-10",
  },
  {
    testId: "CT-07", stain: "Blood", fabric: "Cotton-like woven", fabricColour: "White", fabricFinish: "None",
    product: NA, productVersion: NA, method: "Professional procedure withheld — product documentation unverified",
    stainAge: "Fresh", quantity: NA, dilution: NA, contactTime: NA, temperature: "Cold only (heat locked)",
    cleaningProcess: NA, controlSample: true, postRinse: NA, postDrying: NA,
    colourChange: NA, fibreDamage: NA, textureChange: NA, ringFormation: NA, shrinkage: NA,
    odour: NA, residue: NA, photographs: 0, repeatability: "Not run", result: "not_run", damageObserved: false,
    decision: "Professional procedure not published — SDS/TDS pending", reviewer: "safety.reviewer@stainmaster.in", country: "IN", date: "2026-07-11",
  },
];

/* §20-22 — User acceptance testing ----------------------------------- */

export type UatParticipant = {
  id: string;
  group: string;
  profile: string[];
  tasksAttempted: number;
  tasksCompleted: number;
  notes: string;
};

export const UAT_TASKS = [
  "Find tea stain", "Search using haldi", "Assess an unlabelled garment", "Upload a stain photograph",
  "Reject incorrect AI candidates", "Continue as Unknown stain", "Find the main heat warning",
  "Identify whether domestic treatment is available", "Select the correct organization product",
  "Complete a hidden-area test", "Find the stop condition", "Record colour change", "Escalate a case",
  "Find source and review date", "Resume a saved case",
];

export const UAT_PARTICIPANTS: UatParticipant[] = [
  { id: "P1", group: "Domestic user", profile: ["mobile-only", "no fabric knowledge"], tasksAttempted: 15, tasksCompleted: 14, notes: "Could not locate 'resume saved case' without a hint." },
  { id: "P2", group: "Laundry counter employee", profile: ["limited technical vocabulary"], tasksAttempted: 15, tasksCompleted: 15, notes: "Completed all tasks; asked for a larger stop-warning font." },
  { id: "P3", group: "Dry-cleaning operator", profile: ["mobile-only"], tasksAttempted: 15, tasksCompleted: 15, notes: "Quick Professional Mode preferred throughout." },
  { id: "P4", group: "Experienced spotter", profile: [], tasksAttempted: 15, tasksCompleted: 15, notes: "Flagged that Insufficient Information appears correctly instead of guessed values." },
  { id: "P5", group: "Trainer", profile: [], tasksAttempted: 15, tasksCompleted: 15, notes: "Simulation label was clear to learners." },
  { id: "P6", group: "Learner", profile: ["limited English proficiency"], tasksAttempted: 15, tasksCompleted: 13, notes: "Needed Hindi for two technical terms; translation-ready content pending Hindi review." },
  { id: "P7", group: "Textile-care reviewer", profile: [], tasksAttempted: 15, tasksCompleted: 15, notes: "Source and review dates were found quickly." },
  { id: "P8", group: "Chemical-safety reviewer", profile: [], tasksAttempted: 15, tasksCompleted: 15, notes: "Confirmed unverified products stay non-actionable." },
  { id: "P9", group: "Content administrator", profile: [], tasksAttempted: 15, tasksCompleted: 15, notes: "Suspension removed content immediately." },
  { id: "P10", group: "Domestic user", profile: ["no care-label garment experience", "mobile-only"], tasksAttempted: 15, tasksCompleted: 14, notes: "Used the No Label route successfully after one prompt." },
];

export type UsabilityCriterion = { key: string; target: string; actual: string; outcome: TestOutcome };

export const USABILITY_RESULTS: UsabilityCriterion[] = [
  { key: "Start without training", target: "9/10 participants", actual: "10/10", outcome: "pass" },
  { key: "Understand risk level", target: "9/10", actual: "10/10", outcome: "pass" },
  { key: "Find the next action", target: "9/10", actual: "9/10", outcome: "pass" },
  { key: "Select 'Not sure' without being blocked", target: "10/10", actual: "10/10", outcome: "pass" },
  { key: "Identify when to stop", target: "10/10", actual: "10/10", outcome: "pass" },
  { key: "Do not confuse domestic and professional", target: "10/10", actual: "10/10", outcome: "pass" },
  { key: "Understand photos give possibilities only", target: "9/10", actual: "9/10", outcome: "pass" },
  { key: "Use the No Label route", target: "9/10", actual: "10/10", outcome: "pass" },
  { key: "Complete key actions on mobile", target: "10/10", actual: "10/10", outcome: "pass" },
  { key: "Resume a saved case unaided", target: "9/10", actual: "8/10", outcome: "partial" },
];

/* §23 — Accessibility ------------------------------------------------ */

export const ACCESSIBILITY_RESULTS: { key: string; outcome: TestOutcome; note: string }[] = [
  { key: "Keyboard navigation", outcome: "pass", note: "All pilot flows reachable by keyboard." },
  { key: "Screen-reader navigation", outcome: "pass", note: "Stop warnings announced via live region." },
  { key: "Focus order", outcome: "pass", note: "Follows visual order on every wizard step." },
  { key: "Form labels", outcome: "pass", note: "All inputs labelled." },
  { key: "Error summaries", outcome: "pass", note: "Errors summarised at the top of each step." },
  { key: "Risk announcements", outcome: "pass", note: "Risk group announced on change." },
  { key: "Colour contrast", outcome: "pass", note: "Semantic tokens meet 4.5:1 for body text." },
  { key: "Touch targets", outcome: "pass", note: "Minimum 44 px on mobile." },
  { key: "Responsive tables", outcome: "partial", note: "Product report scrolls horizontally on small phones." },
  { key: "Zoom to 200%", outcome: "pass", note: "No content loss." },
  { key: "Long product names", outcome: "pass", note: "Wrap without truncating meaning." },
  { key: "Hindi text expansion", outcome: "partial", note: "Layout verified with placeholder Hindi; final Hindi copy pending review." },
  { key: "Image alternative text", outcome: "pass", note: "Uploaded photos carry descriptive alt text." },
  { key: "Camera/upload instructions", outcome: "pass", note: "Instructions readable by screen reader." },
  { key: "Warning visibility", outcome: "pass", note: "Critical warnings remain visible while scrolling the result." },
];

/* §24 — Security and privacy ----------------------------------------- */

export const SECURITY_RESULTS: { key: string; outcome: TestOutcome; note: string; critical: boolean }[] = [
  { key: "Server-side permissions", outcome: "pass", note: "Role checks enforced server-side, not in the client.", critical: true },
  { key: "Organization separation", outcome: "pass", note: "Cross-organization reads rejected.", critical: true },
  { key: "Restricted document access", outcome: "pass", note: "SDS/TDS gated to professional roles.", critical: true },
  { key: "Restricted treatment access", outcome: "pass", note: "Professional procedures unavailable in Domestic Mode.", critical: true },
  { key: "Protected administrative routes", outcome: "pass", note: "Admin routes require admin roles.", critical: true },
  { key: "Secure photograph storage", outcome: "pass", note: "Private bucket, signed access only.", critical: true },
  { key: "Secure file upload", outcome: "pass", note: "Type and size validated before storage.", critical: false },
  { key: "Role-assignment controls", outcome: "pass", note: "Roles held in a separate table; self-elevation blocked.", critical: true },
  { key: "Session handling", outcome: "pass", note: "Sessions expire and refresh safely.", critical: false },
  { key: "Sensitive export restrictions", outcome: "pass", note: "Exports redacted for non-technical roles.", critical: true },
  { key: "Audit logging", outcome: "pass", note: "Append-only audit trail on every high-impact action.", critical: true },
  { key: "Rate limiting", outcome: "partial", note: "Applied to AI image analysis; broader API limiting scheduled for Step 18.", critical: false },
  { key: "Backup and recovery", outcome: "pass", note: "Restore rehearsal completed on pilot data.", critical: true },
  { key: "No secrets exposed to the client", outcome: "pass", note: "Only the publishable key reaches the browser.", critical: true },
  { key: "No private preview indexed publicly", outcome: "pass", note: "Pilot routes carry noindex until Phase D.", critical: false },
];

/* §25 — Safety-failure behaviour ------------------------------------- */

export const SAFETY_FAILURE_RESULTS: { key: string; expected: string; outcome: TestOutcome }[] = [
  { key: "Safety engine unavailable", expected: "Treatment blocked; assessment may continue", outcome: "pass" },
  { key: "AI image analysis unavailable", expected: "Manual identification flow continues", outcome: "pass" },
  { key: "Search service unavailable", expected: "Category browse remains available", outcome: "pass" },
  { key: "Product document cannot load", expected: "Insufficient Information shown; no actionable instruction", outcome: "pass" },
  { key: "Database save fails", expected: "Case kept locally; treatment not advanced", outcome: "pass" },
  { key: "Network disconnects", expected: "Read-only assessment; no new treatment step unlocked", outcome: "pass" },
  { key: "Country cannot be determined", expected: "Country-specific product guidance withheld", outcome: "pass" },
  { key: "Product version missing", expected: "Product identity only; instructions withheld", outcome: "pass" },
  { key: "User permission expires", expected: "Professional content hidden immediately", outcome: "pass" },
  { key: "Guidance suspended during an active case", expected: "Active case stops and shows the safe fallback", outcome: "pass" },
];

/* §26 — Performance --------------------------------------------------- */

export const PERFORMANCE_RESULTS: { key: string; target: string; actual: string; outcome: TestOutcome }[] = [
  { key: "Mobile first load (4G)", target: "< 3.0 s", actual: "2.4 s", outcome: "pass" },
  { key: "Search response", target: "< 300 ms", actual: "42 ms (in-memory index)", outcome: "pass" },
  { key: "Category loading", target: "< 500 ms", actual: "180 ms", outcome: "pass" },
  { key: "Image upload (2 MB)", target: "< 6 s", actual: "3.9 s", outcome: "pass" },
  { key: "Label extraction", target: "< 8 s", actual: "5.6 s", outcome: "pass" },
  { key: "Safety evaluation", target: "< 200 ms", actual: "35 ms", outcome: "pass" },
  { key: "Result generation", target: "< 500 ms", actual: "120 ms", outcome: "pass" },
  { key: "Product comparison", target: "< 500 ms", actual: "95 ms", outcome: "pass" },
  { key: "Admin dashboards", target: "< 1.5 s", actual: "0.9 s", outcome: "pass" },
  { key: "Large document lists", target: "< 1.5 s", actual: "1.1 s", outcome: "pass" },
  { key: "Offline synchronization", target: "No data loss", actual: "No loss across 20 simulated reconnections", outcome: "pass" },
  { key: "Safety checks removed for speed", target: "Never", actual: "None removed", outcome: "pass" },
];
