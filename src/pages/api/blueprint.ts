import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import type { APIRoute } from "astro";

const groq = createGroq({
  apiKey: import.meta.env.GROQ_API_KEY,
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { messages } = await request.json();

    // Vercel AI SDK v6 sends UI metadata (like 'id' and 'parts' arrays).
    // streamText strictly expects only 'role' and string 'content'.
    // This maps the UI messages to the strict ModelMessage schema.
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
  "scope": "5-7 must-have features for Phase 1",
  "timeline": "Realistic phase bands",
  "next_steps": "3 immediate actions the client can take"
}
[BLUEPRINT_END]`;

    const result = await streamText({
model: groq('llama-3.3-70b-versatile'),
      messages: coreMessages,
      system: systemPrompt,
      maxRetries: 0,
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    // If an error occurs, send it back so the client UI can catch it
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
};
