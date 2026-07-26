# Use Mawsool with Zapier & Make

Both platforms have first-class **Apify** integrations, so you can run Mawsool lookups without code.

## Zapier

1. Create a Zap with your trigger (e.g. *New Contact in HubSpot*, *New Row in Google Sheets*).
2. Add the **Apify** action → **Run Actor** (synchronously).
3. Pick the Actor:
   - `oday/mawsool-email-linkedin-lookup` for **email → LinkedIn**
   - `oday/mawsool-linkedin-profile-finder` for **name + company → LinkedIn**
4. Set the input JSON, mapping fields from your trigger:

   ```json
   {"emails": ["{{email}}"]}
   ```

   or

   ```json
   {
     "people": [{
       "firstName": "{{first_name}}",
       "lastName": "{{last_name}}",
       "company": "{{company}}"
     }],
     "matchStrategy": "name_company_job_title"
   }
   ```

5. Add a final action: *Update HubSpot Contact* / *Update Google Sheets Row* with `linkedinUrl`, `headline`, `company`, `location` from the Actor output. Use a Filter step on `hasLinkedIn = true` to skip non-matches.

## Make (Integromat)

1. Add the **Apify → Run an Actor** module.
2. Choose the same Actors as above and paste the same input JSON with mapped variables.
3. Add **Apify → Get Dataset Items** to read results, then route with a filter on `hasLinkedIn`.

## Typical automations

- **New lead → enrich → CRM:** verify identity before the lead hits your sales team.
- **Monthly CRM refresh:** schedule a scenario that re-checks stale contacts and updates titles/companies.
- **Form signups → LinkedIn:** enrich newsletter or demo-request signups for lead scoring.

Actor pages: [Email to LinkedIn](https://apify.com/oday/mawsool-email-linkedin-lookup) · [Profile Finder](https://apify.com/oday/mawsool-linkedin-profile-finder)
