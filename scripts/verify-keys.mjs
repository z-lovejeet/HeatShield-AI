import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function verifyKeys() {
  console.log("=== HeatShield AI — API Key & Model Fallback Verification ===\n");
  let allPassed = true;

  // 1. Test Mapbox Token
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!mapboxToken) {
    console.error("[FAIL] NEXT_PUBLIC_MAPBOX_TOKEN is missing in .env.local");
    allPassed = false;
  } else {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/Portland.json?access_token=${mapboxToken}&limit=1`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        console.log(
          `[PASS] Mapbox API Token valid! Geocoded: "${data.features?.[0]?.place_name}"`
        );
      } else {
        console.error(`[FAIL] Mapbox API returned HTTP ${res.status}`);
        allPassed = false;
      }
    } catch (err) {
      console.error("[FAIL] Mapbox request error:", err.message);
      allPassed = false;
    }
  }

  // 2. Test Groq API (openai/gpt-oss-120b & 20b)
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.error("[FAIL] GROQ_API_KEY is missing in .env.local");
    allPassed = false;
  } else {
    for (const model of ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "Reply with the single word READY" }],
            max_tokens: 50,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content?.trim() || "OK (reasoning)";
          console.log(`[PASS] Groq (${model}) connected successfully! -> "${reply}"`);
        } else {
          console.warn(`[WARN] Groq (${model}) returned HTTP ${res.status}`);
        }
      } catch (err) {
        console.warn(`[WARN] Groq (${model}) error:`, err.message);
      }
    }
  }

  // 3. Test Gemini API Fallback Chain
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.error("[FAIL] GEMINI_API_KEY is missing in .env.local");
    allPassed = false;
  } else {
    const geminiModels = [
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
    ];

    let atLeastOneGeminiPassed = false;
    for (const model of geminiModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Say READY" }] }],
            }),
            signal: AbortSignal.timeout(8000),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "OK";
          console.log(
            `[PASS] Gemini (${model}) connected successfully! -> "${reply}"`
          );
          atLeastOneGeminiPassed = true;
        } else {
          console.warn(`[WARN] Gemini (${model}) returned HTTP ${res.status} (will fallback)`);
        }
      } catch (err) {
        console.warn(`[WARN] Gemini (${model}) timeout/error: ${err.message} (will fallback)`);
      }
    }

    if (!atLeastOneGeminiPassed) {
      console.error("[FAIL] All Gemini models in fallback chain failed!");
      allPassed = false;
    } else {
      console.log("[PASS] Gemini fallback chain active and operational!");
    }
  }

  console.log("\n====================================================");
  if (!allPassed) {
    process.exit(1);
  }
}

verifyKeys();
