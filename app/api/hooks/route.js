import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const MODEL_CANDIDATES = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-8b",
  "gemini-1.5-flash-8b-latest",
  "gemini-2.0-flash"
];
const HOOK_COUNT = 10;

function validatePayload(body) {
  const requiredFields = [
    "productName",
    "productCategory",
    "targetAudience",
    "tone"
  ];

  for (const key of requiredFields) {
    if (!body?.[key] || typeof body[key] !== "string") {
      return `Missing or invalid field: ${key}`;
    }
  }

  return null;
}

function extractJsonObject(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue with fallback parsing below.
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1]);
    } catch {
      // Continue with fallback parsing below.
    }
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && start < end) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  return null;
}

function getFriendlyErrorMessage(error) {
  const providerMessage =
    error instanceof Error ? error.message.replace(/\s+/g, " ").trim() : "";
  const lowered = providerMessage.toLowerCase();

  if (lowered.includes("429") || lowered.includes("quota")) {
    return "Your Gemini API quota has been reached. Please check your Google AI Studio plan/billing, wait for quota reset, or use a different API key.";
  }

  if (lowered.includes("401") || lowered.includes("api key not valid")) {
    return "Your Gemini API key appears invalid. Please verify GEMINI_API_KEY in .env.local.";
  }

  if (lowered.includes("403")) {
    return "Access to the selected Gemini model was denied for this API key/project. Please check model access and API permissions in Google AI Studio.";
  }

  if (lowered.includes("404") || lowered.includes("is not found")) {
    return "The requested Gemini model is unavailable for this API version/key. Please try again with model access enabled in Google AI Studio.";
  }

  if (providerMessage) {
    return `Something went wrong while generating hooks. Please try again in a moment (${providerMessage.slice(
      0,
      220
    )})`;
  }

  return "Something went wrong while generating hooks. Please try again in a moment.";
}

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing GEMINI_API_KEY. Please set it in .env.local." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validationError = validatePayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { productName, productCategory, targetAudience, tone } = body;

    const prompt = `
You are an expert TikTok Shop content strategist.

Generate exactly ${HOOK_COUNT} high-converting TikTok video opening hooks for the product details below.

Requirements:
- Each hook must be punchy, scroll-stopping, and optimized for the first 3 seconds.
- Each hook must be 1-2 sentences maximum.
- Hooks must feel native to TikTok and match the requested tone.
- Do not include numbering, labels, or explanations.
- Return only raw JSON matching this shape:
{
  "hooks": ["hook 1", "hook 2", "... exactly ${HOOK_COUNT} total"]
}

Product name: ${productName}
Product category: ${productCategory}
Target audience: ${targetAudience}
Tone: ${tone}
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    let rawText = "";
    let lastModelError = null;

    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 1,
            topP: 0.95
          }
        });
        const result = await model.generateContent(prompt);
        rawText = result.response.text();
        lastModelError = null;
        break;
      } catch (modelError) {
        lastModelError = modelError;
      }
    }

    if (!rawText) {
      throw lastModelError || new Error("No compatible Gemini model was available.");
    }

    const parsed = extractJsonObject(rawText);

    if (!Array.isArray(parsed?.hooks) || parsed.hooks.length !== HOOK_COUNT) {
      return NextResponse.json(
        { error: "Could not generate exactly 10 hooks. Please try again." },
        { status: 502 }
      );
    }

    const cleanedHooks = parsed.hooks.map((hook) => String(hook).trim());

    if (cleanedHooks.some((hook) => !hook)) {
      return NextResponse.json(
        { error: "Generated hooks were invalid. Please regenerate." },
        { status: 502 }
      );
    }

    return NextResponse.json({ hooks: cleanedHooks });
  } catch (error) {
    return NextResponse.json(
      {
        error: getFriendlyErrorMessage(error)
      },
      { status: 500 }
    );
  }
}
