const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image, fabric, color, age, notes } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "A photo is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const details = [
      fabric ? `Fabric: ${fabric}` : null,
      color ? `Garment colour: ${color}` : null,
      age ? `Stain condition/age: ${age}` : null,
      notes ? `Extra details: ${notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are a master laundry & stain-removal technician (Stain Master by GILM).
Look at the photo of the stained garment plus the given details and deduce the 3 MOST LIKELY stains.
Categories you may use: Combination Stains, Oil / Grease-Based Stains, Water-Based Stains, Dye-Based / Tannin Stains, Protein-Based Stains, Particulate (Solid) Stains, Pigment / Paint Stains, Dye Transfer / Color Bleeding, Oxidizable Stains, Heat-Set / Aged Stains, Reducible (Metal/Rust) Stains, Chemical Stains / Fabric Damage.
Always respect fabric safety (no chlorine bleach on wool/silk, no hot water on protein stains, etc.).
Return ONLY JSON, no markdown fences.`;

    const userPrompt = `${details || "No extra details provided."}

Return JSON exactly in this shape:
{"results":[{"name":"","category":"","confidence":0,"why":"","professional":"","diy":"","doNot":""}]}
Give exactly 3 results, ordered most likely first, confidence 0-100.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`AI gateway failed [${res.status}]: ${body}`);
      const message =
        res.status === 429
          ? "Too many requests right now. Please try again in a moment."
          : res.status === 402
            ? "AI credits exhausted. Please add credits to continue."
            : "Could not analyse the photo. Please try again.";
      return new Response(JSON.stringify({ error: message, status: res.status }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { results: [] };
    }

    const results = Array.isArray((parsed as { results?: unknown })?.results)
      ? (parsed as { results: unknown[] }).results.slice(0, 3)
      : [];

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-stain error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error analysing the stain." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
