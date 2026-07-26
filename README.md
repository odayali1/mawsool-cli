# Mawsool CLI — CRM Enrichment from Your Terminal

**Find verified LinkedIn profiles from emails or name + company. Clean, enrich, and update your HubSpot / Salesforce / Pipedrive contact lists in one command.**

Built by **[Mawsool](https://mawsool.tech)** — B2B lead intelligence with 1B+ verified contacts.  
Website: **[mawsool.tech](https://mawsool.tech)** · Support: **[support@mawsool.tech](mailto:support@mawsool.tech)**

> ### ⚡ Don't want to manage API keys or write code?
> **Run the cloud-hosted version on Apify instantly** — free account, pay per result, CSV in / CSV out:
>
> | I have... | Run this |
> |-----------|----------|
> | **Emails** → want LinkedIn profiles | [**Email to LinkedIn Finder →**](https://apify.com/oday/mawsool-email-linkedin-lookup) |
> | **Names + companies** → want LinkedIn profiles | [**LinkedIn Profile Finder →**](https://apify.com/oday/mawsool-linkedin-profile-finder) |

---

## What it does

| Command | Input | Output |
|---------|-------|--------|
| `mawsool email` | Email address(es) | Verified LinkedIn profile: name, headline, company, location, URL |
| `mawsool person` | First + last name + company | Matching LinkedIn profile with confidence level |
| `mawsool csv` | A CRM export (CSV) | The same CSV **enriched** with LinkedIn columns |

**Exact matches only.** If `hasLinkedIn` is `true`, that profile belongs to that person — no fuzzy guessing, no false positives. Uncertain matches come back as `hasLinkedIn: false` so you can filter them out.

This CLI is a **thin client**: all matching runs on [Mawsool](https://mawsool.tech)'s cloud (1B+ verified B2B contacts). No scraping, no proxies, no LinkedIn login or cookies.

---

## Quick start (cloud mode — recommended)

Works with a free [Apify](https://apify.com) account. You pay per result through Apify — no Mawsool key needed.

```bash
npm install -g mawsool-cli

# Get a token at https://console.apify.com/settings/integrations
export APIFY_TOKEN=apify_api_...        # Windows: set APIFY_TOKEN=apify_api_...

mawsool email jane.doe@acme.com
```

Output:

```text
jane.doe@acme.com  MATCH (exact)
  Name:     Jane Doe
  Headline: VP Sales at Acme Inc
  Company:  Acme Inc
  Location: New York, NY
  LinkedIn: https://www.linkedin.com/in/janedoe
```

### Direct API mode

Have a Mawsool API key? (Request one: [support@mawsool.tech](mailto:support@mawsool.tech))

```bash
export MAWSOOL_API_KEY=your-key
mawsool email jane.doe@acme.com
```

---

## CRM enrichment recipes

### 1. Enrich a CRM contact export (emails → LinkedIn)

Export contacts from HubSpot / Salesforce / Pipedrive with an `email` column, then:

```bash
mawsool csv crm-contacts.csv --out crm-contacts-enriched.csv
```

You get back every row plus `hasLinkedIn`, `fullName`, `headline`, `company`, `location`, `linkedinUrl` — ready to import back into your CRM.

### 2. Clean a stale email list

Rows with `hasLinkedIn = false` have no verified professional identity — flag them for removal or re-verification:

```bash
mawsool csv old-contacts.csv --out checked.csv
# then filter checked.csv by the hasLinkedIn column
```

### 3. Fill missing LinkedIn URLs (name + company lists)

Lead lists and event attendee sheets usually have names but no LinkedIn URLs. Use a CSV with `firstName,lastName,company` (+ optional `jobTitle,linkedinUrl`):

```bash
mawsool csv leads.csv --out leads-enriched.csv --strategy name_company_job_title
```

### 4. Look up one person

```bash
mawsool person --first Nathan --last Jolly \
  --company "4 Pines Brewing Company Pty Ltd" --title "Brand Manager"
```

### 5. Verify a LinkedIn URL you already have

```bash
mawsool person --first Nathan --last Jolly \
  --company "4 Pines Brewing Company Pty Ltd" \
  --url https://linkedin.com/in/nathan-jolly-45490b20b
```

---

## Commands & options

```text
mawsool email <email> [more emails...]
mawsool person --first <f> --last <l> --company <c>
               [--title <jobTitle>] [--url <linkedinUrl>] [--strategy <s>]
mawsool csv <input.csv> [--out <enriched.csv>] [--strategy <s>]

--json     Print raw JSON
--cloud    Force Apify cloud mode even when MAWSOOL_API_KEY is set
```

**Match strategies** (`--strategy`): `linkedin_url` (exact, default when a URL is present), `name_company_job_title` (recommended otherwise), `name_company`, `name_job_title`, `company_job_title`, `name`, `company`, `job_title`.

**Match types** in results: `exact` (LinkedIn URL match) · `confident` (strong name/company/title score) · `likely` / `none` (returned as `hasLinkedIn: false`).

---

## When to use the CLI vs. the Apify Actors

| | CLI (this repo) | [Apify Actors](https://apify.com/oday/mawsool-email-linkedin-lookup) |
|---|---|---|
| Setup | Node 18+, terminal | Browser only — no install |
| Auth | Mawsool key or Apify token | Apify account (free tier) |
| Bulk lists | CSV in/out | CSV paste/upload, up to 10,000 rows per run |
| Scheduling | Your own cron | Built-in Scheduler (e.g. monthly CRM refresh) |
| Integrations | Scripts / pipelines | Zapier, Make, webhooks, Google Sheets, API |
| Billing | Mawsool credits or Apify pay-per-result | Apify pay-per-result (from $1/1,000) |

For no-code workflows, scheduled CRM refreshes, or Zapier/Make/Clay pipelines, the **hosted Actors are the easiest path** — try the [ready-made CRM enrichment example tasks](https://apify.com/oday/mawsool-email-linkedin-lookup).

---

## More integration examples

- [cURL / raw HTTP](examples/curl.md)
- [Python](examples/python/lookup.py)
- [Clay](examples/clay.md)
- [n8n](examples/n8n.md)
- [Zapier & Make](examples/zapier-make.md)
- [Sample CRM CSV](examples/data/sample-crm-contacts.csv)

---

## FAQ

**Is this a LinkedIn scraper?**
No. It calls Mawsool's verified contact-intelligence API. No LinkedIn pages are scraped, and no LinkedIn login or cookies are needed.

**Do failed lookups return garbage data?**
No. Anything not verified comes back as `hasLinkedIn: false` with empty profile fields — safe to filter on.

**Can I run this in CI or a nightly job?**
Yes — it's a plain Node CLI. For managed scheduling, use the [Apify Actor](https://apify.com/oday/mawsool-email-linkedin-lookup) with the built-in Scheduler instead.

**How much does it cost?**
Cloud mode: from **$2 / 1,000 emails** and **$1 / 1,000 people lookups** on Apify (volume discounts apply). Direct API: contact [support@mawsool.tech](mailto:support@mawsool.tech).

---

## About Mawsool

[Mawsool](https://mawsool.tech) is a B2B lead-intelligence platform with 1B+ verified global contacts, built for sales, recruiting, and RevOps teams.

- **Website:** [https://mawsool.tech](https://mawsool.tech)
- **Support:** [support@mawsool.tech](mailto:support@mawsool.tech)
- **Apify Email → LinkedIn:** [apify.com/oday/mawsool-email-linkedin-lookup](https://apify.com/oday/mawsool-email-linkedin-lookup)
- **Apify Name + Company → LinkedIn:** [apify.com/oday/mawsool-linkedin-profile-finder](https://apify.com/oday/mawsool-linkedin-profile-finder)

**License:** MIT
