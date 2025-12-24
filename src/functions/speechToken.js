const { app } = require("@azure/functions");

app.http("speechToken", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

    // CORS preflight
    if (request.method === "OPTIONS") {
      return {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      };
    }

    const speechKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !region) {
      return {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Azure Speech is not configured on the server."
        })
      };
    }

    const tokenUrl =
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": speechKey
      }
    });

    const tokenText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      return {
        status: tokenResponse.status,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Failed to generate Speech token",
          detail: tokenText
        })
      };
    }

    return {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: tokenText,
        region
      })
    };
  }
});
