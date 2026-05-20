const http = require("node:http");

const PORT = Number(process.env.PORT || 3000);
const SPREADSHEET_ID = "1NDTklJxtW9jLJYtqh9v-lXN1O_-6lEXi0MalVzL_QeQ";
const GID = "1037034171";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;

function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift() || [];
  return rows
    .filter((values) => values.some((value) => value.trim()))
    .map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])),
    );
}

async function getCustomerIdByName(fullName) {
  const response = await fetch(SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error(`Google Sheets returned HTTP ${response.status}`);
  }

  const rows = parseCsv(await response.text());
  const match = rows.find(
    (row) => normalizeName(row["Customer Name"]) === normalizeName(fullName),
  );

  return match ? match["Customer ID"] : null;
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function sendHtml(res) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Customer ID Lookup</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Arial, Helvetica, sans-serif;
      color: #18212f;
      background: #f4f7fb;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      box-sizing: border-box;
    }

    main {
      width: min(100%, 520px);
      background: #ffffff;
      border: 1px solid #d9e2ef;
      border-radius: 8px;
      padding: 28px;
      box-shadow: 0 18px 45px rgba(24, 33, 47, 0.08);
    }

    h1 {
      margin: 0 0 18px;
      font-size: 28px;
      line-height: 1.15;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 700;
    }

    .row {
      display: flex;
      gap: 10px;
    }

    input {
      flex: 1;
      min-width: 0;
      border: 1px solid #b8c7d9;
      border-radius: 6px;
      padding: 12px 13px;
      font-size: 16px;
    }

    button {
      border: 0;
      border-radius: 6px;
      background: #126b5d;
      color: white;
      padding: 12px 16px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }

    button:disabled {
      cursor: wait;
      opacity: 0.7;
    }

    #result {
      margin-top: 18px;
      min-height: 28px;
      font-size: 17px;
      line-height: 1.4;
    }

    .success {
      color: #0f766e;
      font-weight: 700;
    }

    .error {
      color: #b42318;
      font-weight: 700;
    }

    @media (max-width: 520px) {
      main {
        padding: 22px;
      }

      .row {
        display: grid;
      }
    }
  </style>
</head>
<body>
  <main>
    <h1>Customer ID Lookup</h1>
    <form id="lookup-form">
      <label for="fullName">Full name</label>
      <div class="row">
        <input id="fullName" name="fullName" autocomplete="name" placeholder="Soumalya Chowdhury" required>
        <button type="submit">Search</button>
      </div>
    </form>
    <div id="result" role="status" aria-live="polite"></div>
  </main>

  <script>
    const form = document.querySelector("#lookup-form");
    const input = document.querySelector("#fullName");
    const button = document.querySelector("button");
    const result = document.querySelector("#result");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const fullName = input.value.trim();
      if (!fullName) return;

      button.disabled = true;
      result.className = "";
      result.textContent = "Searching...";

      try {
        const response = await fetch("/api/customer-id?fullName=" + encodeURIComponent(fullName));
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Lookup failed");
        }

        if (data.customer_id) {
          result.className = "success";
          result.textContent = "Customer ID: " + data.customer_id;
        } else {
          result.className = "error";
          result.textContent = "No customer found for that full name.";
        }
      } catch (error) {
        result.className = "error";
        result.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
  </script>
</body>
</html>`);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/") {
    sendHtml(res);
    return;
  }

  if (url.pathname === "/api/customer-id") {
    const fullName = url.searchParams.get("fullName");
    if (!fullName) {
      sendJson(res, 400, { error: "fullName is required" });
      return;
    }

    try {
      const customerId = await getCustomerIdByName(fullName);
      sendJson(res, 200, { full_name: fullName, customer_id: customerId });
    } catch (error) {
      sendJson(res, 502, {
        error: "Could not read the Google Sheet. Check internet access and sheet sharing.",
        detail: error.message,
      });
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Customer lookup agent running at http://localhost:${PORT}`);
});
