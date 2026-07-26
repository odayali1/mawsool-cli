# Use Mawsool in Clay (LinkedIn enrichment column)

Add a verified **email → LinkedIn** or **name + company → LinkedIn** column to any Clay table using Clay's **HTTP API** enrichment.

## Email → LinkedIn column

1. In your Clay table, click **Add Enrichment → HTTP API**.
2. Configure:
   - **Method:** `POST`
   - **URL:** `https://api.apify.com/v2/acts/oday~mawsool-email-linkedin-lookup/run-sync-get-dataset-items?timeout=300`
   - **Headers:**
     - `Authorization`: `Bearer YOUR_APIFY_TOKEN` (get one free at https://console.apify.com/settings/integrations)
     - `Content-Type`: `application/json`
   - **Body:**

     ```json
     {"emails": ["{{Email}}"]}
     ```

     where `{{Email}}` is your email column.
3. Run the column. The response is an array with one row — map fields like `linkedinUrl`, `fullName`, `headline`, `company`, `location` to new columns.
4. Filter or format on `hasLinkedIn` = `true` to keep only verified contacts.

## Name + company → LinkedIn column

Same setup, different Actor and body:

- **URL:** `https://api.apify.com/v2/acts/oday~mawsool-linkedin-profile-finder/run-sync-get-dataset-items?timeout=300`
- **Body:**

  ```json
  {
    "people": [{
      "firstName": "{{First Name}}",
      "lastName": "{{Last Name}}",
      "company": "{{Company}}",
      "jobTitle": "{{Title}}"
    }],
    "matchStrategy": "name_company_job_title"
  }
  ```

## Tips

- Mawsool returns **exact/confident matches only** — `hasLinkedIn: false` rows are safe to treat as "not found", so your Clay waterfalls stay clean.
- For large tables, batch rows into fewer Actor runs via the [Apify Actor pages](https://apify.com/oday/mawsool-email-linkedin-lookup) and import the CSV back into Clay.
