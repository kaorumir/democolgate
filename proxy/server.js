const express = require("express");

const app = express();

// Recibimos XML como texto
app.use(express.text({ type: ["application/xml", "text/xml", "*/*"], limit: "2mb" }));

/**
 * ENV necesarios (ponlos en CF como variables):
 * TOKEN_URL=https://oauthasservices-.../oauth2/api/v1/token
 * CLIENT_ID=...
 * CLIENT_SECRET=...
 * CPI_BASE_URL=https://p800040-iflmap.hcisbp.us4.hana.ondemand.com
 */
function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

async function fetchToken() {
  const tokenUrl = mustEnv("TOKEN_URL");
  const clientId = mustEnv("CLIENT_ID");
  const clientSecret = mustEnv("CLIENT_SECRET");

  // Basic Auth como Postman (client_authentication: header)
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`Token error HTTP ${res.status}: ${txt}`);
  }

  let json;
  try {
    json = JSON.parse(txt);
  } catch (e) {
    throw new Error(`Token response not JSON: ${txt}`);
  }

  if (!json.access_token) {
    throw new Error(`Token missing access_token: ${txt}`);
  }
  return json.access_token;
}

app.get("/health", (_, res) => res.status(200).send("OK"));

// ====== ENDPOINT: INSERT HU ======
app.post("/api/inserthu", async (req, res) => {
  try {
    const token = await fetchToken();
    const cpiBaseUrl = mustEnv("CPI_BASE_URL");

    const cpiRes = await fetch(`${cpiBaseUrl}/http/inserthu`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/xml",
        "Accept": "application/xml"
      },
      body: req.body
    });

    const text = await cpiRes.text();
    res.status(cpiRes.status).send(text);

  } catch (e) {
    console.error(e);
    res.status(500).send("Proxy error: " + e.message);
  }
});

app.post("/api/selecthu", async (req, res) => {
  try {
    const cpiBaseUrl = mustEnv("CPI_BASE_URL");
    const token = await fetchToken();

    // CPI endpoint final
    const url = `${cpiBaseUrl}/http/selecthu`;

    const cpiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/xml; charset=utf-8",
        "Accept": "application/xml"
      },
      body: req.body || ""
    });

    const cpiTxt = await cpiRes.text();

    // Reenviamos tal cual la respuesta
    res.status(cpiRes.status);
    res.set("Content-Type", cpiRes.headers.get("content-type") || "application/xml");
    res.send(cpiTxt);

  } catch (e) {
    console.error(e);
    res.status(500).send(String(e.message || e));
  }
});

app.post("/api/selectprinter", async (req, res) => {
  try {
    const cpiBaseUrl = mustEnv("CPI_BASE_URL");
    const token = await fetchToken();

    const url = `${cpiBaseUrl}/http/selectprinter`;

    const cpiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/xml; charset=utf-8",
        "Accept": "application/xml"
      },
      body: req.body || "<ROOT/>"
    });

    const cpiTxt = await cpiRes.text();
    res.status(cpiRes.status);
    res.set("Content-Type", cpiRes.headers.get("content-type") || "application/xml");
    res.send(cpiTxt);
  } catch (e) {
    console.error(e);
    res.status(500).send(String(e.message || e));
  }
});

app.post("/api/selectpuesto_trabajo", async (req, res) => {
  try {
    const cpiBaseUrl = mustEnv("CPI_BASE_URL");
    const token = await fetchToken();

    const url = `${cpiBaseUrl}/http/selectpuesto_trabajo`;

    const cpiRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/xml; charset=utf-8",
        "Accept": "application/xml"
      },
      body: req.body || "<ROOT/>"
    });

    const cpiTxt = await cpiRes.text();
    res.status(cpiRes.status);
    res.set("Content-Type", cpiRes.headers.get("content-type") || "application/xml");
    res.send(cpiTxt);
  } catch (e) {
    console.error(e);
    res.status(500).send(String(e.message || e));
  }
});

// CF usa PORT
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Proxy listening on ${port}`));
