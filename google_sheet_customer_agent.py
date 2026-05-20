import csv
import io
import json
import urllib.request


class GoogleSheetCustomerIdAgent:
    def __init__(self, spreadsheet_id, gid):
        self.csv_url = (
            f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"
            f"/export?format=csv&gid={gid}"
        )

    def run(self):
        with urllib.request.urlopen(self.csv_url) as response:
            csv_text = response.read().decode("utf-8")

        rows = csv.DictReader(io.StringIO(csv_text))
        return [row["Customer ID"] for row in rows if row.get("Customer ID")]


if __name__ == "__main__":
    agent = GoogleSheetCustomerIdAgent(
        spreadsheet_id="1NDTklJxtW9jLJYtqh9v-lXN1O_-6lEXi0MalVzL_QeQ",
        gid="1037034171",
    )
    print(json.dumps({"customer_ids": agent.run()}, indent=2))
