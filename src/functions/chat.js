const { app } = require("@azure/functions");

app.http("chat", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

    // CORS preflight
    if (request.method === "OPTIONS") {
      return {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      };
    }

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion =
      process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";

    if (!endpoint || !apiKey || !deployment) {
      return {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Azure OpenAI is not configured on the server."
        })
      };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Invalid JSON body." })
      };
    }

    const messages = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Request must include a messages array."
        })
      };
    }

    const url = new URL(
      `openai/deployments/${deployment}/chat/completions`,
      endpoint
    );
    url.searchParams.set("api-version", apiVersion);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        messages,
        temperature: 0.7,
        max_tokens: 400
      })
    });

    const text = await response.text();

    return {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Content-Type": "application/json"
      },
      body: text
    };
  }
});
