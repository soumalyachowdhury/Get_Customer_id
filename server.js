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

async function getCustomerIdByPhoneNumber(phoneNumber) {
  const response = await fetch(SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error(`Google Sheets returned HTTP ${response.status}`);
  }

  const rows = parseCsv(await response.text());
  const match = rows.find(
    (row) => normalizePhoneNumber(row["Phone Number"]) === normalizePhoneNumber(phoneNumber),
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
      <label for="phoneNumber">Phone number</label>
      <div class="row">
        <input id="phoneNumber" name="phoneNumber" autocomplete="tel" inputmode="tel" placeholder="2016588874" required>
        <button type="submit">Search</button>
      </div>
    </form>
    <div id="result" role="status" aria-live="polite"></div>
  </main>

  <script>
    const form = document.querySelector("#lookup-form");
    const input = document.querySelector("#phoneNumber");
    const button = document.querySelector("button");
    const result = document.querySelector("#result");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const phoneNumber = input.value.trim();
      if (!phoneNumber) return;

      button.disabled = true;
      result.className = "";
      result.textContent = "Searching...";

      try {
        const response = await fetch("/api/customer-id?phoneNumber=" + encodeURIComponent(phoneNumber));
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || "Lookup failed");
        }

        if (data.customer_id) {
          result.className = "success";
          result.textContent = "Customer ID: " + data.customer_id;
        } else {
          result.className = "error";
          result.textContent = "No customer found for that phone number.";
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
    const phoneNumber = url.searchParams.get("phoneNumber");
    if (!phoneNumber) {
      sendJson(res, 400, { message: "phoneNumber is required", customer_id: null });
      return;
    }

    try {
      const customerId = await getCustomerIdByPhoneNumber(phoneNumber);
      sendJson(res, 200, {
        message: customerId
          ? "Customer ID found."
          : "No customer found for that phone number.",
        phone_number: phoneNumber,
        customer_id: customerId,
      });
    } catch (error) {
      sendJson(res, 502, {
        message: "Could not read the Google Sheet. Check internet access and sheet sharing.",
        customer_id: null,
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
