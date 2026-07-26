"""CRM enrichment with Mawsool - Python example.

Enrich a list of emails with verified LinkedIn profiles via the Apify-hosted
Actor (no Mawsool API key needed - free Apify account, pay per result):
https://apify.com/oday/mawsool-email-linkedin-lookup

Usage:
    export APIFY_TOKEN=apify_api_...
    python lookup.py jane.doe@acme.com john@company.com
"""

import csv
import json
import os
import sys
import urllib.request

ACTOR = "oday~mawsool-email-linkedin-lookup"
API = f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items?timeout=300"


def lookup_emails(emails: list[str]) -> list[dict]:
    token = os.environ["APIFY_TOKEN"]
    req = urllib.request.Request(
        API,
        data=json.dumps({"emails": emails}).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as res:
        return json.load(res)


def main() -> None:
    emails = sys.argv[1:]
    if not emails:
        print("Usage: python lookup.py <email> [more emails...]")
        sys.exit(1)

    rows = lookup_emails(emails)

    # Print a summary and write a CRM-ready CSV
    with open("enriched.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["email", "hasLinkedIn", "fullName", "headline", "company", "location", "linkedinUrl"],
            extrasaction="ignore",
        )
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
            status = "MATCH" if row.get("hasLinkedIn") else "no match"
            print(f"{row.get('email')}: {status} {row.get('linkedinUrl', '')}")

    print("\nWrote enriched.csv - import it back into your CRM.")


if __name__ == "__main__":
    main()
