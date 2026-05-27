import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Look for the webhook URL in your .env file
    const webhookUrl = import.meta.env.LEAD_WEBHOOK_URL ;
    
    if (webhookUrl) {
      // Send the data to your Webhook (Make, Zapier, Discord, Slack, etc.)
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'Tencio Blueprint AI',
          clientName: data.name,
          clientContact: data.contact,
          blueprint: data.blueprint, // The AI generated blueprint
          chatHistory: data.history  // What they chatted about
        })
      });
      console.log("Lead successfully forwarded to Webhook.");
    } else {
      console.warn("LEAD_WEBHOOK_URL is missing in .env! Lead captured locally:", data);
    }
    
    return new Response(JSON.stringify({ success: true, message: "Lead captured successfully" }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};