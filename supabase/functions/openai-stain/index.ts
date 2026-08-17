import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODEL = "gpt-4.1";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["results"],
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "category", "confidence", "why", "professional", "diy", "doNot"],
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          confidence: { type: "number" },
          why: { type: "string" },
          professional: { type: "string" },
          diy: { type: "string" },
          doNot: { type: "string" },
        },
      },
    },
  },
};

const SYSTEM = `You are a master laundry & stain-removal technician (Stain Master by GILM).
From the photo of the stained garment plus the given details, deduce the 3 MOST LIKELY stains.
Allowed categories: Combination Stains, Oil / Grease-Based Stains, Water-Based Stains, Dye-Based / Tannin Stains, Protein-Based Stains, Particulate (Solid) Stains, Pigment / Paint Stains, Dye Transfer / Color Bleeding, Oxidizable Stains, Heat-Set / Aged Stains, Reducible (Metal/Rust) Stains, Chemical Stains / Fabric Damage.
Always respect fabric safety (no chlorine bleach on wool/silk, no hot water on protein stains, no solvent on acetate, etc.).
Return exactly 3 results, most likely first, confidence 0-100.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured on the server." }, 500);

    const body = await req.json().catch(() => null);
    const image = typeof body?.image === "string" ? body.image : "";
    if (!image || !/^data:image\/|^https?:\/\//.test(image)) {
      return json({ error: "A valid photo is required." }, 400);
    }
    const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 500) : "");
    const details = [
      str(body?.fabric) && `Fabric: ${str(body?.fabric)}`,
      str(body?.color) && `Garment colour: ${str(body?.color)}`,
      str(body?.age) && `Stain condition/age: ${str(body?.age)}`,
      str(body?.notes) && `Extra details: ${str(body?.notes)}`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        instructions: SYSTEM,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: details || "No extra details provided." },
              { type: "input_image", image_url: image },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "stain_analysis",
            strict: true,
            schema: SCHEMA,
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text();
      console.error(`OpenAI failed [${res.status}]: ${errText}`);
      const message =
        res.status === 429
          ? "Too many requests right now. Please try again in a moment."
          : res.status === 401
            ? "The AI key on the server is invalid."
            : res.status === 402 || res.status === 403
              ? "AI access is currently blocked on the server account."
              : "Could not analyse the photo. Please try again.";
      return json({ error: message, status: res.status }, res.status);
    }

    // Consume the SSE stream server-side and accumulate the final text.
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
            console.error("OpenAI stream error:", payload);
          }
        } catch {
          // ignore malformed keep-alive chunks
        }
      }
    }

    if (streamError && !text) {
      const quota =
        streamError.code === "credit_balance_exhausted" || streamError.code === "insufficient_quota";
      return json(
        {
          error: quota
            ? "The OpenAI account linked to this server has no credits left. Add credits to your OpenAI billing to continue."
            : streamError.message || "The AI request failed. Please try again.",
          code: streamError.code,
        },
        quota ? 402 : 502,
      );
    }

    let parsed: { results?: unknown[] } = {};
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
    if (!results.length) return json({ error: "Could not read the stain. Try a clearer photo." }, 502);

    return json({ results, model: MODEL });
  } catch (e) {
    console.error("openai-stain error:", e);
    return json({ error: "Unexpected error analysing the stain." }, 500);
  }
});
