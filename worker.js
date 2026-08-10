// Recap proxy — holds your Anthropic API key server-side so it never
// appears in the app's client-side code. Deploy this on Cloudflare Workers
// (free tier), then set the ANTHROPIC_API_KEY secret in the Worker's
// Settings > Variables, and set ALLOWED_ORIGIN below to your GitHub Pages
// URL so random strangers can't use your Worker as a free relay.

const ALLOWED_ORIGIN = "https://YOUR-USERNAME.github.io"; // <-- change this to your actual GitHub Pages origin (no trailing slash)

function corsHeaders(){
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

export default {
  async fetch(request, env){
    if(request.method === "OPTIONS"){
      return new Response(null, { headers: corsHeaders() });
    }
    if(request.method !== "POST"){
      return new Response("Method not allowed", { status: 405, headers: corsHeaders() });
    }

    let body;
    try{
      body = await request.json();
    }catch(e){
      return new Response("Invalid JSON body", { status: 400, headers: corsHeaders() });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });

    const data = await anthropicRes.text();
    return new Response(data, {
      status: anthropicRes.status,
      headers: { ...corsHeaders(), "content-type": "application/json" }
    });
  }
};
