# Customer ID Lookup Agent

Browser-accessible agent that reads a public Google Sheet and returns customer details when a user searches by full name, part of a name, or phone number.

## What It Does

- Serves a browser form at `http://127.0.0.1:3000`
- Accepts a full name, part of a name, or phone number
- Reads the `Customer Loyalty Program` Google Sheet tab through the public CSV export URL
- Matches against the `Customer Name` or `Phone Number` columns
- Returns the matching customer ID, loyalty ID, coupon details, and meal preference

Current sample lookup:

```text
Soumalya -> CUST10045
2016588874 -> CUST10045
```

## Files

- `server.js` - Node.js browser app and API server
- `package.json` - Node project metadata and `npm start` command
- `google_sheet_customer_agent.py` - Python command-line version
- `google_sheet_customer_agent.ps1` - PowerShell command-line version
- `start-server.ps1` - PowerShell launcher for the local browser app

## Run The Browser App Locally

Open PowerShell:

```powershell
cd C:\Users\Owner\Documents\Codex\2026-05-20\what-is-agent-sandbox
powershell -ExecutionPolicy Bypass -File .\start-server.ps1
```

Keep that PowerShell window open while using the app.

Then open:

```text
http://127.0.0.1:3000
```

## Direct API Access

You can also call the API directly from a browser:

```text
http://127.0.0.1:3000/api/customer-id?query=Soumalya
```

Phone number searches are supported too:

```text
http://127.0.0.1:3000/api/customer-id?query=2016588874
```

Expected JSON:

```json
{
  "message": "1 customer match found.",
  "query": "Soumalya",
  "matches": [
    {
      "customer_id": "CUST10045",
      "loyalty_id": "LOY10045",
      "coupon": {
        "active": "Yes",
        "offer": "15% on meat items",
        "details": "15% off all meat items",
        "valid_from": "2026-06-01",
        "valid_until": "2026-12-31"
      },
      "meal_preference": "Non-Vegetarian"
    }
  ]
}
```

## Run With Node Directly

If Node.js is installed and available on PATH:

```powershell
cd C:\Users\Owner\Documents\Codex\2026-05-20\what-is-agent-sandbox
npm start
```

Or:

```powershell
node server.js
```

## Run The PowerShell CLI Agent

```powershell
cd C:\Users\Owner\Documents\Codex\2026-05-20\what-is-agent-sandbox
powershell -ExecutionPolicy Bypass -File .\google_sheet_customer_agent.ps1
```

## Run The Python CLI Agent

Python must be installed first.

```powershell
cd C:\Users\Owner\Documents\Codex\2026-05-20\what-is-agent-sandbox
python google_sheet_customer_agent.py
```

## Deploy To A Node Host

This app has no external npm dependencies. Deploy it to a Node.js host such as Render, Railway, Azure App Service, or Google Cloud Run.

Use this start command:

```bash
npm start
```

Make sure the Google Sheet is shared as:

```text
Anyone with the link can view
```

## GitHub Upload Commands

If Git is installed locally, run these commands from this folder:

```powershell
cd C:\Users\Owner\Documents\Codex\2026-05-20\what-is-agent-sandbox
git init
git add README.md server.js package.json start-server.ps1 google_sheet_customer_agent.ps1 google_sheet_customer_agent.py .gitignore
git commit -m "Add customer ID lookup agent"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/customer-id-lookup-agent.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username, or replace the whole remote URL with your repository URL.
