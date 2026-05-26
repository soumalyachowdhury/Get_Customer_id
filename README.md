# Get Customer ID Agent

Browser-accessible agent that reads a public Google Sheet and returns the full customer record as JSON when a user searches by customer ID, loyalty ID, full name, part of a name, or phone number.

## What It Does

- Serves a browser form at `http://127.0.0.1:3000`
- Accepts a customer ID, loyalty ID, full name, part of a name, or phone number
- Reads the `Customer Loyalty Program` Google Sheet tab through the public CSV export URL
- Matches against the `Customer ID`, `Loyalty ID`, `Customer Name`, or `Phone Number` columns
- Returns the full matching customer record in JSON format

Current sample lookup:

```text
Soumalya -> CUST10045
CUST10045 -> CUST10045
LOY10045 -> CUST10045
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

If another local server is already using port `3000`, stop that server first and run `start-server.ps1` again.

## Direct API Access

You can also call the API directly from a browser:

```text
http://127.0.0.1:3000/api/customer-id?query=Soumalya
```

Use `query` for any supported search value: customer ID, loyalty ID, part of a name, full name, or phone number.

Customer ID and loyalty ID searches are supported too:

```text
http://127.0.0.1:3000/api/customer-id?query=CUST10045
http://127.0.0.1:3000/api/customer-id?query=LOY10045
```

Phone number searches are supported too:

```text
http://127.0.0.1:3000/api/customer-id?query=2016588874
```

The API also accepts specific parameter names when needed:

```text
http://127.0.0.1:3000/api/customer-id?customerId=CUST10045
http://127.0.0.1:3000/api/customer-id?loyaltyId=LOY10045
http://127.0.0.1:3000/api/customer-id?name=Soumalya
http://127.0.0.1:3000/api/customer-id?phoneNumber=2016588874
```

Expected JSON:

```json
{
  "message": "1 customer match found.",
  "query": "Soumalya",
  "matches": [
    {
      "Customer ID": "CUST10045",
      "Loyalty ID": "LOY10045",
      "Customer Name": "Soumalya Chowdhury",
      "Phone Number": "2016588874",
      "Family Size": "4",
      "Dietary Preference": "Non-Vegetarian",
      "Active Coupon": "Yes",
      "Coupon Details": "15% off all meat items",
      "Coupon": "15% on meat items"
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
git remote add origin https://github.com/soumalyachowdhury/Get_Customer_id.git
git push -u origin main
```

The GitHub repository is `soumalyachowdhury/Get_Customer_id`.
