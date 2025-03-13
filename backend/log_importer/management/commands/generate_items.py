import json
import os
import requests
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = (
        "Generate or update items.json and sections.json by fetching the new API "
        "data for each major section (bosses, clues, minigames, raids, other)."
    )

    def handle(self, *args, **options):
        # Define the five major sections we want to fetch.
        major_sections = ["bosses", "raids", "clues", "minigames", "other"]

        # Base URL for the new API.
        base_url = "https://templeosrs.com/api/collection-log/player_collection_log.php"
        player = "Lonesoldier"  # update if needed

        # These are the constant query parameters.
        base_params = {
            "player": player,
            "includenames": "1",
            "includemissingitems": "1"
        }

        # Determine file paths.
        current_dir = os.path.dirname(os.path.abspath(__file__))
        static_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "static"))
        items_json_path = os.path.join(static_dir, "items.json")
        sections_json_path = os.path.join(static_dir, "sections.json")

        # Load existing items.json if it exists, otherwise initialize an empty dict.
        if os.path.exists(items_json_path):
            try:
                with open(items_json_path, "r", encoding="utf-8") as f:
                    items_data = json.load(f)
                self.stdout.write(f"Loaded existing items.json with {len(items_data)} items.")
            except Exception as e:
                self.stdout.write(self.style.WARNING(
                    f"Warning: Could not load items.json, starting fresh. Error: {e}"
                ))
                items_data = {}
        else:
            self.stdout.write("No existing items.json found. Creating a new one.")
            items_data = {}

        # Initialize our sections data structure.
        sections_data = {}

        # Counter for new items added.
        new_items_count = 0

        # Loop over each major section and fetch its data.
        for section in major_sections:
            self.stdout.write(f"Fetching data for major section: {section}")
            params = base_params.copy()
            params["categories"] = section

            try:
                response = requests.get(base_url, params=params, timeout=10)
                if response.status_code != 200:
                    self.stdout.write(self.style.ERROR(
                        f"Failed to fetch {section}. Status code: {response.status_code}"
                    ))
                    continue
                json_data = response.json()
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"Exception while fetching data for {section}: {e}"
                ))
                continue

            # In the new API, the items are under the "data" key.
            data = json_data.get("data", {})
            items = data.get("items", {})

            # Initialize the section key in sections_data.
            sections_data[section] = {}

            # Iterate through each sub-category within the current major section.
            for subcategory, items_list in items.items():
                # Initialize an empty list for this sub-category.
                sections_data[section][subcategory] = []
                for item in items_list:
                    item_id = item.get("id")
                    item_name = item.get("name")
                    if not item_id or not item_name:
                        continue
                    item_key = str(item_id)
                    # Add item to items_data if it doesn't already exist.
                    if item_key not in items_data:
                        items_data[item_key] = {
                            "id": item_id,
                            "name": item_name,
                            "imageUrl": ""  # Optionally fill this later
                        }
                        new_items_count += 1
                        self.stdout.write(f"Added item [{item_id}] {item_name}")
                    else:
                        # Optionally update the name if it has changed.
                        if items_data[item_key]["name"] != item_name:
                            self.stdout.write(
                                f"Updating name for itemId {item_id}: "
                                f'{items_data[item_key]["name"]} -> {item_name}'
                            )
                            items_data[item_key]["name"] = item_name

                    # Append the item's ID (as string) to the current sub-category list.
                    sections_data[section][subcategory].append(item_key)

        # Save the updated items_data to items.json.
        with open(items_json_path, "w", encoding="utf-8") as f:
            json.dump(items_data, f, indent=2, ensure_ascii=False)
        self.stdout.write(self.style.SUCCESS(
            f"Successfully updated items.json with {len(items_data)} items."
        ))
        if new_items_count:
            self.stdout.write(self.style.SUCCESS(f"New items added: {new_items_count}"))
        else:
            self.stdout.write(self.style.SUCCESS("No new items added."))

        # Save the sections_data to sections.json.
        with open(sections_json_path, "w", encoding="utf-8") as f:
            json.dump(sections_data, f, indent=2, ensure_ascii=False)
        self.stdout.write(self.style.SUCCESS("Successfully updated sections.json."))
