import csv
import io
import json
import urllib.request


def normalize_phone_number(value):
    return "".join(char for char in str(value or "") if char.isdigit())


class GoogleSheetCustomerIdAgent:
    def __init__(self, spreadsheet_id, gid):
        self.csv_url = (
            f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"
            f"/export?format=csv&gid={gid}"
        )

    def run(self, phone_number):
        with urllib.request.urlopen(self.csv_url) as response:
            csv_text = response.read().decode("utf-8")

        rows = csv.DictReader(io.StringIO(csv_text))
        requested_phone = normalize_phone_number(phone_number)

        for row in rows:
            if normalize_phone_number(row.get("Phone Number")) == requested_phone:
                return {
                    "message": "Customer ID found.",
                    "phone_number": phone_number,
                    "customer_id": row.get("Customer ID"),
                }

        return {
            "message": "No customer found for that phone number.",
            "phone_number": phone_number,
            "customer_id": None,
        }


if __name__ == "__main__":
    phone_number = input("Phone number: ").strip()
    agent = GoogleSheetCustomerIdAgent(
        spreadsheet_id="1NDTklJxtW9jLJYtqh9v-lXN1O_-6lEXi0MalVzL_QeQ",
        gid="1037034171",
    )
    print(json.dumps(agent.run(phone_number), indent=2))
