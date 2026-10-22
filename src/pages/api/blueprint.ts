import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import type { APIRoute } from "astro";

const groqApiKey = import.meta.env.GROQ_API_KEY;
const googleApiKey = import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY || import.meta.env.GEMINI_API_KEY;

const groq = groqApiKey ? createGroq({ apiKey: groqApiKey }) : null;
const google = googleApiKey ? createGoogleGenerativeAI({ apiKey: googleApiKey }) : null;

// Build candidate list with primary model and automatic fallbacks
const candidates: Array<{ name: string; getModel: () => any }> = [];

if (groq) {
  const primaryModel = import.meta.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  candidates.push({ name: primaryModel, getModel: () => groq(primaryModel) });
  
  if (primaryModel !== 'openai/gpt-oss-120b') {
    candidates.push({ name: 'openai/gpt-oss-120b', getModel: () => groq('openai/gpt-oss-120b') });
  }
  if (primaryModel !== 'openai/gpt-oss-20b') {
    candidates.push({ name: 'openai/gpt-oss-20b', getModel: () => groq('openai/gpt-oss-20b') });
  }
}

if (google) {
  candidates.push({ name: 'gemini-2.0-flash', getModel: () => google('gemini-2.0-flash') });
  candidates.push({ name: 'gemini-1.5-flash', getModel: () => google('gemini-1.5-flash') });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages } = await request.json();

    // Vercel AI SDK v6 sends UI metadata (like 'id' and 'parts' arrays).
    // streamText strictly expects only 'role' and string 'content'.
    const coreMessages = messages.map((m: any) => ({
      role: m.role,
      content: Array.isArray(m.parts)
        ? m.parts.map((p: any) => p.text || "").join("")
        : m.content,
    }));

    const systemPrompt = `You are Tencio's AI project strategist. You help potential clients clarify and scope their digital product ideas. You are concise, expert, and build confidence. Never say you're an AI - stay in the role of a senior Tencio strategist.

FLOW:
1. When the user describes their idea, ask exactly 3 short clarifying questions (scope, timeline, success metric). YOU MUST FORMAT THESE QUESTIONS AS A NUMBERED LIST WITH LINE BREAKS. DO NOT WRITE A SINGLE PARAGRAPH.
2. After the user answers, you must generate a structured Project Blueprint.

CRITICAL INSTRUCTION FOR BLUEPRINT GENERATION:
When you generate the blueprint, you MUST output ONLY raw JSON between [BLUEPRINT_START] and [BLUEPRINT_END] markers. 
DO NOT use markdown formatting (no \`\`\`json or \`\`\` blocks). Just the raw curly braces.

Format exactly like this:
[BLUEPRINT_START]
{
  "architecture": "Recommended tech stack with 1-line rationale",
  "scope": [
    "5-7 must-have features for Phase 1",
    "Each feature as a distinct clear bullet point"
  ],
  "timeline": "Realistic phase bands (e.g. Weeks 1-2: Discovery & Design; Weeks 3-4: Build & Launch)",
  "next_steps": [
    "3 immediate actions the client can take",
    "Each action as a distinct clear bullet point"
  ]
}
[BLUEPRINT_END]`;

    let lastError: any = null;

    // Failover loop through models
    for (const cand of candidates) {
      try {
        const result = streamText({
          model: cand.getModel(),
          messages: coreMessages,
          system: systemPrompt,
          maxRetries: 2,
        });

        // Peek first chunk to ensure provider accepted the request
        const reader = result.textStream[Symbol.asyncIterator]();
        const first = await reader.next();
        if (first.value !== undefined || first.done) {
          return result.toUIMessageStreamResponse();
        }
      } catch (err: any) {
        console.warn(`[Tencio AI] Model ${cand.name} failed, falling back... Error:`, err?.message || err);
        lastError = err;
      }
    }

    throw lastError || new Error("All AI model providers failed to respond. Please check your API keys.");
  } catch (err: any) {
    // If all fail, send the error back so the client UI can catch it
    return new Response(JSON.stringify({ error: err.message || "An unexpected error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

