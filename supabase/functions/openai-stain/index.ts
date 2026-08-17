import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "gpt-4.1";

const DISCLAIMER =
  "This is AI guidance, not a guaranteed diagnosis. Always test any product on a hidden area (inside seam, hem or pocket facing) first, and stop if colour lifts or the fabric changes.";

const RESULT_ITEM = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "category",
    "confidence",
    "confidenceLabel",
    "why",
    "treatment",
    "products",
    "steps",
    "fabricPrecautions",
    "avoid",
    "consultProfessional",
    "professionalReason",
  ],
  properties: {
    name: { type: "string", description: "Likely stain" },
    category: { type: "string" },
    confidence: { type: "number", description: "0-100" },
    confidenceLabel: { type: "string", enum: ["High", "Medium", "Low"] },
    why: { type: "string", description: "Visual and contextual evidence for this call" },
    treatment: { type: "string", description: "Recommended treatment in one or two sentences" },
    products: {
      type: "array",
      description: "Chemicals or products required",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "type", "notes"],
        properties: {
          name: { type: "string" },
          type: { type: "string", description: "e.g. Solvent, Enzyme, Alkali, Oxidiser, Acid, Neutral" },
          notes: { type: "string", description: "Dilution, temperature or handling note" },
        },
      },
    },
    steps: { type: "array", description: "Step-by-step procedure, in order", items: { type: "string" } },
    fabricPrecautions: { type: "array", items: { type: "string" } },
    avoid: { type: "array", description: "Actions to avoid", items: { type: "string" } },
    consultProfessional: { type: "boolean" },
    professionalReason: { type: "string" },
  },
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["results", "overallNote"],
  properties: {
    results: { type: "array", items: RESULT_ITEM },
    overallNote: { type: "string", description: "One short caution covering the whole assessment" },
  },
};

const SYSTEM = `You are a master laundry and stain-removal technician (Stain Master by GILM).
From the photograph plus the supplied details, deduce the 3 MOST LIKELY stains, most likely first.
Allowed categories: Combination Stains, Oil / Grease-Based Stains, Water-Based Stains, Dye-Based / Tannin Stains, Protein-Based Stains, Particulate (Solid) Stains, Pigment / Paint Stains, Dye Transfer / Color Bleeding, Oxidizable Stains, Heat-Set / Aged Stains, Reducible (Metal/Rust) Stains, Chemical Stains / Fabric Damage.
Rules:
- Respect fabric safety: no chlorine bleach on wool, silk or elastane; no hot water on protein stains; no solvent on acetate or triacetate; no alkali on wool or silk; no mechanical agitation on delicate weaves.
- Every recommendation must be specific: name products, dilution, temperature and dwell time where relevant.
- Set consultProfessional to true and explain why whenever confidence is low, the fabric is delicate or unidentified, the garment is coloured and bleeding is possible, the stain is heat-set or aged, or the stain may be a chemical/damage case rather than a soil.
- confidenceLabel must match confidence: High >= 75, Medium 45-74, Low < 45.
Return exactly 3 results.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // The key is read only here, server-side. It is never logged or returned.
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured on the server." }, 500);

    const body = await req.json().catch(() => null);
    const image = typeof body?.image === "string" ? body.image : "";
    if (!image || !/^data:image\/(jpeg|jpg|png|webp|heic);base64,/i.test(image)) {
      return json({ error: "A valid JPG, PNG or WebP photo is required." }, 400);
    }
    if (image.length > 12_000_000) {
      return json({ error: "That photo is too large. Please use one under 8 MB." }, 400);
    }

    const str = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 500) : "");
    const fabric = str(body?.fabric);
    const colour = str(body?.color) || str(body?.colour);
    const source = str(body?.source);
    const age = str(body?.age);
    const notes = str(body?.notes);

    const details = [
      fabric && `Fabric type: ${fabric}`,
      colour && `Fabric colour: ${colour}`,
      source && `Stain source (as reported): ${source}`,
      age && `Stain age / condition: ${age}`,
      notes && `Extra details: ${notes}`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        instructions: SYSTEM,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: details ? `Known details:\n${details}` : "No extra details were provided.",
              },
              { type: "input_image", image_url: image },
            ],
          },
        ],
        text: { format: { type: "json_schema", name: "stain_analysis", strict: true, schema: SCHEMA } },
      }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text();
      console.error(`OpenAI request failed [${res.status}]`, errText.slice(0, 500));
      const message =
        res.status === 429
          ? "Too many requests right now. Please wait a few seconds and retry."
          : res.status === 401
            ? "The AI credential on the server is invalid. Please contact support."
            : res.status === 400
              ? "The photo could not be processed. Try a different image."
              : "Could not analyse the photo. Please retry.";
      return json({ error: message, retryable: res.status === 429 || res.status >= 500 }, res.status);
    }

    // Stream is consumed server-side; only the finished result leaves this function.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let streamError: { code?: string; message?: string } | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          } else if (evt.type === "response.completed" && evt.response?.output_text) {
            text = evt.response.output_text;
          } else if (evt.type === "error" || evt.type === "response.failed") {
            streamError = evt.error ?? evt.response?.error ?? { message: "AI request failed." };
            console.error("OpenAI stream error:", JSON.stringify(streamError));
          }
        } catch {
          // ignore keep-alive / partial chunks
        }
      }
    }

    if (streamError && !text) {
      const quota =
        streamError.code === "credit_balance_exhausted" || streamError.code === "insufficient_quota";
      return json(
        {
          error: quota
            ? "The OpenAI account linked to this server has no credits left. Add credits to continue."
            : streamError.message || "The AI request failed. Please retry.",
          code: streamError.code,
          retryable: !quota,
        },
        quota ? 402 : 502,
      );
    }

    let parsed: { results?: unknown[]; overallNote?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = {};
        }
      }
    }

    const results = Array.isArray(parsed.results) ? parsed.results.slice(0, 3) : [];
    if (!results.length) {
      return json({ error: "Could not read the stain. Try a clearer, closer photo.", retryable: true }, 502);
    }

    const payload = {
      results,
      overallNote: typeof parsed.overallNote === "string" ? parsed.overallNote : "",
      disclaimer: DISCLAIMER,
      model: MODEL,
      saved: false,
    };

    // Store history for the signed-in user only, under their own row (RLS enforced).
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader.startsWith("Bearer ")) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          { global: { headers: { Authorization: authHeader } } },
        );
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (uid) {
          const { error: insertError } = await supabase.from("stain_analyses").insert({
            user_id: uid,
            fabric: fabric || null,
            colour: colour || null,
            stain_source: source || null,
            stain_age: age || null,
            notes: notes || null,
            model: MODEL,
            result: { results, overallNote: payload.overallNote },
          });
          if (insertError) console.error("history insert failed:", insertError.message);
          else payload.saved = true;
        }
      } catch (e) {
        console.error("history write skipped:", e instanceof Error ? e.message : "unknown");
      }
    }

    return json(payload);
  } catch (e) {
    console.error("openai-stain error:", e instanceof Error ? e.message : "unknown");
    return json({ error: "Unexpected error analysing the stain.", retryable: true }, 500);
  }
});
