import json
import os
import time
import re
import requests
from bs4 import BeautifulSoup
from difflib import SequenceMatcher
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = (
        "Waterfall approach for item images + store wiki page URL:\n"
        "1) Find wiki page for item ID (store wikiPageUrl)\n"
        "2) Guess-based direct .png\n"
        "3) Parse infobox HTML to find main sprite\n"
        "4) Fuzzy approach w/ ratio >= 0.7\n"
        "If all fail, skip."
    )

    WIKI_LOOKUP_URL = "https://oldschool.runescape.wiki/w/Special:Lookup?type=item&id={item_id}"
    WIKI_BASE_PAGE = "https://oldschool.runescape.wiki/w/"  # For the HTML parse
    WIKI_API_URL = "https://oldschool.runescape.wiki/api.php"

    REQUEST_DELAY = 0.05

    def handle(self, *args, **options):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        static_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "static"))
        items_json_path = os.path.join(static_dir, "items.json")

        if not os.path.exists(items_json_path):
            self.stdout.write(self.style.ERROR(f"items.json not found at {items_json_path}"))
            return

        with open(items_json_path, "r", encoding="utf-8") as f:
            items_data = json.load(f)

        all_keys = list(items_data.keys())
        total_items = len(all_keys)
        self.stdout.write(f"Loaded items.json with {total_items} items.")

        updated_count = 0
        failed_items = []

        for idx, key in enumerate(all_keys, start=1):
            item = items_data[key]
            item_id = item["id"]
            item_name = item["name"]

            # Skip if we already have an image
            if item.get("imageUrl"):
                self.stdout.write(
                    f"[{idx}/{total_items}] '{item_name}' => already has imageUrl, skipping."
                )
                continue

            self.stdout.write(f"\n[{idx}/{total_items}] Processing ID={item_id}, name='{item_name}'...")

            # ----------------------------------------------------------------
            # STEP 1) Always get page title / final URL first, so we can store
            #         wikiPageUrl no matter which approach ends up working.
            # ----------------------------------------------------------------
            page_title, final_url = self.get_page_title_for_item(item_id)
            if final_url:
                # Store it so front end can link the wiki page
                item["wikiPageUrl"] = final_url
            else:
                # If we have no final_url at all, it’s likely not found on the wiki
                self.stdout.write(self.style.WARNING(
                    f" => No wiki page found for {item_id} ({item_name})."
                ))
                failed_items.append((item_id, item_name))
                continue

            # ----------------------------------------------------------------
            # STEP 2) Guess-based approach
            # ----------------------------------------------------------------
            guess_url = self.try_guess_url(item_name)
            if guess_url:
                item["imageUrl"] = guess_url
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f" => [Guess-Based] Found: {guess_url}")
                )
                self.save_items_json(items_json_path, items_data)
                time.sleep(self.REQUEST_DELAY)
                continue

            # ----------------------------------------------------------------
            # STEP 3) HTML Infobox parse
            # ----------------------------------------------------------------
            infobox_url = self.parse_infobox_image(page_title)
            if infobox_url:
                item["imageUrl"] = infobox_url
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f" => [HTML Infobox] Found: {infobox_url}")
                )
                self.save_items_json(items_json_path, items_data)
                time.sleep(self.REQUEST_DELAY)
                continue

            # ----------------------------------------------------------------
            # STEP 4) Fuzzy approach (with higher threshold)
            # ----------------------------------------------------------------
            fuzzy_url = self.fuzzy_lookup(page_title, item_name, min_ratio=0.7)
            if fuzzy_url:
                item["imageUrl"] = fuzzy_url
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f" => [Fuzzy Approach] Found: {fuzzy_url}")
                )
                self.save_items_json(items_json_path, items_data)
                time.sleep(self.REQUEST_DELAY)
                continue

            # If everything fails:
            self.stdout.write(self.style.WARNING(" => [NO IMAGE FOUND]"))
            failed_items.append((item_id, item_name))

        # Final summary
        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Updated {updated_count} items out of {total_items}."
        ))
        if failed_items:
            self.stdout.write(self.style.ERROR("\nItems with no imageUrl:"))
            for fid, fname in failed_items:
                self.stdout.write(f" - ID={fid}, Name='{fname}'")

    # ----------------------------------------------------------------------
    # A) Page title from item ID (store page URL)
    # ----------------------------------------------------------------------
    def get_page_title_for_item(self, item_id):
        lookup_url = self.WIKI_LOOKUP_URL.format(item_id=item_id)
        self.stdout.write(f"[DEBUG] GET: {lookup_url}")

        headers = {
            "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"),
            "Referer": "https://oldschool.runescape.wiki/"
        }

        try:
            r = requests.get(lookup_url, headers=headers, allow_redirects=True, timeout=10)
            final_url = r.url
            self.stdout.write(f"[DEBUG] Status: {r.status_code}, final URL: {final_url}")

            if "Special:Lookup" in final_url:
                return (None, None)

            page_title = final_url.split("/").pop()
            page_title = requests.utils.unquote(page_title)
            return (page_title, final_url)

        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f"[ERROR] in get_page_title_for_item({item_id}): {e}"
            ))
            return (None, None)

    # ----------------------------------------------------------------------
    # B) Guess-based method
    # ----------------------------------------------------------------------
    def try_guess_url(self, item_name):
        guess_filename = re.sub(r"[’']", "", item_name)
        guess_filename = guess_filename.replace(" ", "_") + ".png"
        guess_url = f"https://oldschool.runescape.wiki/images/{guess_filename}"

        headers = {
            "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"),
            "Referer": "https://oldschool.runescape.wiki/"
        }

        try:
            r = requests.get(guess_url, headers=headers, stream=True, timeout=5)
            if r.status_code == 200:
                return guess_url
            else:
                self.stdout.write(f" => [Guess] GET {guess_url} => {r.status_code}")
                return None
        except Exception as e:
            self.stdout.write(f"[ERROR] Guess approach failed for {guess_url}: {e}")
            return None

    # ----------------------------------------------------------------------
    # C) HTML Infobox parse
    # ----------------------------------------------------------------------
    def parse_infobox_image(self, page_title):
        url = self.WIKI_BASE_PAGE + page_title
        self.stdout.write(f"[DEBUG] Parsing infobox HTML at: {url}")
        headers = {
            "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                           "(KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"),
            "Referer": "https://oldschool.runescape.wiki/"
        }
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code != 200:
                self.stdout.write(f"[DEBUG] parse_infobox: {resp.status_code} for {url}")
                return None

            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, "html.parser")
            infobox_img_td = soup.find("td", class_="infobox-image")
            if not infobox_img_td:
                return None

            img_tag = infobox_img_td.find("img")
            if not img_tag:
                return None

            src = img_tag.get("src", "")
            if not src.startswith("/images/"):
                return None

            return "https://oldschool.runescape.wiki" + src

        except Exception as e:
            self.stdout.write(f"[ERROR] parse_infobox_image({page_title}): {e}")
            return None

    # ----------------------------------------------------------------------
    # D) Fuzzy approach
    # ----------------------------------------------------------------------
    def fuzzy_lookup(self, page_title, item_name, min_ratio=0.7):
        query_params = {
            "action": "query",
            "titles": page_title,
            "prop": "images",
            "format": "json"
        }
        headers = {
            "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"),
            "Referer": "https://oldschool.runescape.wiki/"
        }
        try:
            resp = requests.get(self.WIKI_API_URL, params=query_params, headers=headers, timeout=10)
            data = resp.json()
            pages = data.get("query", {}).get("pages", {})
            if not pages:
                return None

            page_id = next(iter(pages))
            if page_id == "-1":
                return None

            images = pages[page_id].get("images", [])
            if not images:
                return None

            png_images = [img for img in images if ".png" in img["title"].lower() or ".jpg" in img["title"].lower()]
            if not png_images:
                return None

            best_image = self.pick_best_image_match(item_name, png_images, min_ratio)
            if not best_image:
                return None

            file_title = best_image["title"]
            self.stdout.write(f"[DEBUG] fuzzy => best file: {file_title}")
            return self.get_direct_file_url(file_title)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[ERROR] in fuzzy_lookup({page_title}): {e}"))
            return None

    def pick_best_image_match(self, item_name, images_list, min_ratio=0.7):
        def clean_str(s):
            s = s.lower()
            s = re.sub(r"[’']", "", s)
            s = re.sub(r"file:", "", s)
            s = re.sub(r"[^a-z0-9_ ]+", "", s)
            return s.strip()

        item_clean = clean_str(item_name).replace(" ", "_")

        # Substring approach
        substring_candidates = []
        for img in images_list:
            fc = clean_str(img["title"])
            if item_clean in fc:
                substring_candidates.append(img)

        if substring_candidates:
            best = min(substring_candidates, key=lambda i: len(clean_str(i["title"])))
            return best

        # Ratio approach
        best_score = 0.0
        best_img = None
        for img in images_list:
            fc = clean_str(img["title"])
            ratio = SequenceMatcher(None, item_clean, fc).ratio()
            if ratio > best_score:
                best_score = ratio
                best_img = img

        self.stdout.write(f"[DEBUG] fuzzy best ratio: {best_score:.3f}")
        if best_score >= min_ratio:
            return best_img
        return None

    def get_direct_file_url(self, file_title):
        q_params = {
            "action": "query",
            "titles": file_title,
            "prop": "imageinfo",
            "iiprop": "url",
            "format": "json"
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Referer": "https://oldschool.runescape.wiki/"
        }
        try:
            r = requests.get(self.WIKI_API_URL, params=q_params, headers=headers, timeout=10)
            data = r.json()
            pages = data.get("query", {}).get("pages", {})
            if not pages:
                return None

            p_id = next(iter(pages))
            if p_id == "-1":
                return None

            info = pages[p_id].get("imageinfo", [])
            if not info:
                return None

            return info[0].get("url")
        except Exception as e:
            self.stdout.write(f"[ERROR] get_direct_file_url({file_title}): {e}")
            return None

    def save_items_json(self, path, data):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
