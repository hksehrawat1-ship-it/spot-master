# Stain Master Constitution

Permanent, non-negotiable rules for this codebase. Any change that conflicts with a rule
below is a defect, even if it makes a screen look better or a test pass.

The machine-readable form of this document lives in `src/lib/constitution.ts` and is
enforced by `src/lib/contentGate.ts`, the safety engine and the `openai-stain` edge
function. Tests in `src/test/constitution.test.ts` and `src/test/production*.test.ts`
guard the rules.

## 1. Purpose and limits

1. Stain Master is a **decision-support and safety-guidance system**, not a guaranteed
   stain-removal system.
2. Never guarantee complete stain removal. No screen, string, AI output or report may
   promise removal.
3. **Fabric safety takes priority over stain removal.** When the two conflict, the fabric wins.

## 2. Uncertainty rules

4. When the fabric is unknown, uncertain or unlabeled, follow the safest compatible path.
5. A hidden-area test is required whenever compatibility or colourfastness is uncertain.
6. Existing damage, active colour bleeding, or unknown previous chemicals **block** treatment.
   These blocks are non-overridable by client code.

## 3. Content and evidence rules

7. Domestic treatment may be displayed only when evidence confidence is **>= 9/10** and the
   record status is `approved` or `published`.
8. Professional product guidance must come from an approved manufacturer label, spotting
   chart, technical data sheet, safety data sheet or technically reviewed source.
9. **Never invent** product dilution, temperature, dwell time, dosage, compatibility,
   neutralization or safety instructions.
10. If an approved instruction is unavailable, display exactly:
    *"Follow the current product label or technical data sheet."*
11. Every published content record must carry: source, version, approval status, reviewer
    and review date. Records missing any of these are not publishable.

## 4. AI rules

12. AI may suggest possible stain identities (up to three, with confidence and reasoning).
13. AI **cannot** independently approve or prescribe treatment chemistry. AI output must be
    passed through the deterministic safety and eligibility system before any actionable
    guidance is displayed.
14. If the AI or the safety engine is unavailable, show a safe unavailable/escalation
    message — never partial chemistry.

## 5. Security rules

15. Safety-engine blocks must not be bypassed by client-side code.
16. Roles come only from the protected `user_roles` table. Never from Zustand, localStorage,
    URL parameters or interface controls.
17. No hardcoded email, OTP or demo credential may grant authority in production.
18. Hiding a button is not security: every protected interface action must also be protected
    by RLS or a server-side check.
19. Secrets (for example `OPENAI_API_KEY`) live only in server-side function environments.

## 6. Architecture rules

20. Seitz, STAS and Clean Craft are the first companies. Companies, products, kits and
    countries are **data**, never code branches — unlimited future companies must be
    addable without code changes.
21. India-first deployment, with future countries, languages and region-specific product
    availability supported by the schema from day one.
22. Supabase is the authoritative source for production records. Hardcoded records are
    demonstration, provisional or interface-fallback data and must be visibly marked.
23. Safety-critical guidance **fails closed**: if verified data or a safety evaluation is
    unavailable, show nothing actionable.

## 7. Legacy platform

24. The GILM course/certificate/invoice platform is legacy. It stays behind the
    `legacy_courses` feature flag (`src/config/features.ts`) and must not appear in Stain
    Master production navigation, default routing or permissions.
25. Legacy modules that may be removed after confirmation are listed in
    `docs/LEGACY_MODULES.md`.
