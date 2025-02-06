import json
import os
import requests
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = (
        "Generate or update items.json by calling the external Collection Log "
        "API endpoint, then parsing the returned JSON structure."
    )

    def handle(self, *args, **options):
        # 1) Set the API URL for your sample user (update as needed)
        api_url = "https://api.collectionlog.net/collectionlog/user/lonesoldier"

        # 2) Attempt the GET request
        self.stdout.write(f"Requesting sample log data from: {api_url}")
        try:
            r = requests.get(api_url, timeout=10)
            if r.status_code != 200:
                self.stdout.write(self.style.ERROR(
                    f"Failed to fetch data. Status code: {r.status_code}"
                ))
                return
            sample_log_data = r.json()
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f"Exception while requesting {api_url}: {e}"
            ))
            return

        # 3) Safely navigate the JSON to get your tab data, e.g.:
        #    The remote data might differ from your local 'sample_log_data.json'.
        #    Adjust as needed for the actual structure returned by the API.
        collection_log = sample_log_data.get("collectionLog", {})
        tabs = collection_log.get("tabs", {})

        # 4) Locate items.json
        current_dir = os.path.dirname(os.path.abspath(__file__))
        static_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "static"))
        items_json_path = os.path.join(static_dir, "items.json")

        # 5) Load or init items.json
        if os.path.exists(items_json_path):
            with open(items_json_path, "r", encoding="utf-8") as f:
                items_data = json.load(f)
            self.stdout.write(
                f"Loaded existing items.json with {len(items_data)} items."
            )
        else:
            items_data = {}
            self.stdout.write("No existing items.json found. Creating a new one.")

        # 6) Traverse the tabs → sections → items
        for tab_name, tab_content in tabs.items():
            for section_name, section_data in tab_content.items():
                items = section_data.get("items", [])
                for item in items:
                    item_id = item.get("id")
                    item_name = item.get("name")
                    if not item_id or not item_name:
                        continue

                    item_key = str(item_id)
                    # If not in items_data, add it
                    if item_key not in items_data:
                        items_data[item_key] = {
                            "id": item_id,
                            "name": item_name,
                            "imageUrl": ""
                        }
                        self.stdout.write(f"Added item [{item_id}] {item_name}")
                    else:
                        # Optionally update name if changed
                        existing = items_data[item_key]
                        if existing["name"] != item_name:
                            self.stdout.write(
                                f"Updating name for itemId {item_id}: "
                                f'"{existing["name"]}" -> "{item_name}"'
                            )
                            existing["name"] = item_name

        # 7) Save items.json
        with open(items_json_path, "w", encoding="utf-8") as f:
            json.dump(items_data, f, indent=2, ensure_ascii=False)

        self.stdout.write(self.style.SUCCESS(
            f"\nSuccessfully updated items.json with {len(items_data)} items."
        ))
