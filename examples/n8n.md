# Use Mawsool in n8n (CRM enrichment workflow)

Build a no-code workflow: **CRM trigger → Mawsool lookup → update CRM record.**

## HTTP Request node setup

1. Add an **HTTP Request** node.
2. Configure:
   - **Method:** `POST`
   - **URL:** `https://api.apify.com/v2/acts/oday~mawsool-email-linkedin-lookup/run-sync-get-dataset-items?timeout=300`
   - **Authentication:** Generic → Header Auth
     - Name: `Authorization`, Value: `Bearer YOUR_APIFY_TOKEN`
   - **Body (JSON):**

     ```json
     {"emails": ["{{ $json.email }}"]}
     ```

3. The node outputs one item per email with `hasLinkedIn`, `fullName`, `headline`, `company`, `location`, `linkedinUrl`.

## Example workflow: keep HubSpot contacts fresh

```text
Schedule (monthly)
  → HubSpot: Get contacts (with email)
  → HTTP Request: Mawsool email → LinkedIn   (node above)
  → IF hasLinkedIn = true
      → HubSpot: Update contact (LinkedIn URL, job title, company)
  → ELSE
      → Google Sheets: append to "needs review" list
```

## Name + company version

Same node, different URL and body:

- **URL:** `https://api.apify.com/v2/acts/oday~mawsool-linkedin-profile-finder/run-sync-get-dataset-items?timeout=300`
- **Body:**

  ```json
  {
    "people": [{
      "firstName": "{{ $json.firstName }}",
      "lastName": "{{ $json.lastName }}",
      "company": "{{ $json.company }}"
    }],
    "matchStrategy": "name_company_job_title"
  }
  ```

Actor pages: [Email to LinkedIn](https://apify.com/oday/mawsool-email-linkedin-lookup) · [Profile Finder](https://apify.com/oday/mawsool-linkedin-profile-finder)
