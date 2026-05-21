import csv
import io
import json
import urllib.request


def normalize_phone_number(value):
    return "".join(char for char in str(value or "") if char.isdigit())


def normalize_text(value):
    return " ".join(str(value or "").strip().lower().split())


def customer_record(row):
    return {key: value or None for key, value in row.items()}


class GoogleSheetCustomerIdAgent:
    def __init__(self, spreadsheet_id, gid):
        self.csv_url = (
            f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"
            f"/export?format=csv&gid={gid}"
        )

    def run(self, query):
        with urllib.request.urlopen(self.csv_url) as response:
            csv_text = response.read().decode("utf-8")

        rows = csv.DictReader(io.StringIO(csv_text))
        search_text = normalize_text(query)
        search_phone = normalize_phone_number(query)
        looks_like_phone = len(search_phone) >= 7

        matches = []

        for row in rows:
            customer_name = normalize_text(row.get("Customer Name"))
            customer_phone = normalize_phone_number(row.get("Phone Number"))
            customer_id = normalize_text(row.get("Customer ID"))
            loyalty_id = normalize_text(row.get("Loyalty ID"))
            phone_match = looks_like_phone and customer_phone == search_phone
            name_match = bool(search_text and search_text in customer_name)
            customer_id_match = bool(search_text and customer_id == search_text)
            loyalty_id_match = bool(search_text and loyalty_id == search_text)

            if phone_match or name_match or customer_id_match or loyalty_id_match:
                matches.append(customer_record(row))

        return {
            "message": (
                f"{len(matches)} customer match{'es' if len(matches) != 1 else ''} found."
                if matches
                else "No customer found for that search."
            ),
            "query": query,
            "matches": matches,
        }


if __name__ == "__main__":
    query = input("Customer ID, loyalty ID, name, or phone number: ").strip()
    agent = GoogleSheetCustomerIdAgent(
        spreadsheet_id="1NDTklJxtW9jLJYtqh9v-lXN1O_-6lEXi0MalVzL_QeQ",
        gid="1037034171",
    )
    print(json.dumps(agent.run(query), indent=2))
