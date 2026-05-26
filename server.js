const http = require("node:http");

const PORT = Number(process.env.PORT || 3000);
const SPREADSHEET_ID = "1NDTklJxtW9jLJYtqh9v-lXN1O_-6lEXi0MalVzL_QeQ";
const GID = "1037034171";
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;

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

function normalizePhoneNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function customerRecord(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, value === "" ? null : value]),
  );
}

function findCustomers(rows, query) {
  const searchText = normalizeText(query);
  const searchPhone = normalizePhoneNumber(query);
  const looksLikePhone = searchPhone.length >= 7;

  return rows
    .filter((row) => {
      const customerName = normalizeText(row["Customer Name"]);
      const customerPhone = normalizePhoneNumber(row["Phone Number"]);
      const customerId = normalizeText(row["Customer ID"]);
      const loyaltyId = normalizeText(row["Loyalty ID"]);

      if (looksLikePhone && customerPhone === searchPhone) {
        return true;
      }

      return Boolean(
        searchText &&
          (customerName.includes(searchText) ||
            customerId === searchText ||
            loyaltyId === searchText),
      );
    })
    .map(customerRecord);
}

async function searchCustomers(query) {
  const response = await fetch(SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error(`Google Sheets returned HTTP ${response.status}`);
  }

  const rows = parseCsv(await response.text());
  return findCustomers(rows, query);
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

    pre {
      margin: 18px 0 0;
      max-height: 420px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
      background: #f8fafc;
      border: 1px solid #d9e2ef;
      border-radius: 6px;
      padding: 14px;
      color: #18212f;
      font-size: 14px;
      line-height: 1.45;
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
      <label for="query">Customer ID, loyalty ID, name, or phone number</label>
      <div class="row">
        <input id="query" name="query" autocomplete="on" placeholder="Soumalya, CUST10045, LOY10045, or 2016588874" required>
        <button type="submit">Search</button>
      </div>
    </form>
    <div id="result" role="status" aria-live="polite"></div>
  </main>

  <script>
    const form = document.querySelector("#lookup-form");
    const input = document.querySelector("#query");
    const button = document.querySelector("button");
    const result = document.querySelector("#result");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) return;

      button.disabled = true;
      result.className = "";
      result.textContent = "Searching...";

      try {
        const response = await fetch("/api/customer-id?query=" + encodeURIComponent(query));
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || "Lookup failed");
        }

        if (data.matches && data.matches.length) {
          result.className = "success";
          result.innerHTML = "Customer record found.<pre></pre>";
          result.querySelector("pre").textContent = JSON.stringify(data, null, 2);
        } else {
          result.className = "error";
          result.textContent = "No customer found for that search.";
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
    const query =
      url.searchParams.get("query") ||
      url.searchParams.get("q") ||
      url.searchParams.get("customerId") ||
      url.searchParams.get("loyaltyId") ||
      url.searchParams.get("name") ||
      url.searchParams.get("phoneNumber");

    if (!query) {
      sendJson(res, 400, {
        message:
          "query is required. Search by customer ID, loyalty ID, full name, part of a name, or phone number.",
        matches: [],
      });
      return;
    }

    try {
      const matches = await searchCustomers(query);
      sendJson(res, 200, {
        message: matches.length
          ? `${matches.length} customer match${matches.length === 1 ? "" : "es"} found.`
          : "No customer found for that search.",
        query,
        matches,
      });
    } catch (error) {
      sendJson(res, 502, {
        message: "Could not read the Google Sheet. Check internet access and sheet sharing.",
        matches: [],
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
