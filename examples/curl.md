# cURL / raw HTTP examples

Two ways to call Mawsool lookups over HTTP: through **Apify** (no Mawsool key needed) or the **direct API**.

## Option A — via Apify (pay per result, free account)

Get a token at https://console.apify.com/settings/integrations

### Reverse email lookup (email → LinkedIn)

```bash
curl -X POST "https://api.apify.com/v2/acts/oday~mawsool-email-linkedin-lookup/run-sync-get-dataset-items?timeout=300" \
  -H "Authorization: Bearer $APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emails":["jane.doe@acme.com"]}'
```

### Name + company → LinkedIn

```bash
curl -X POST "https://api.apify.com/v2/acts/oday~mawsool-linkedin-profile-finder/run-sync-get-dataset-items?timeout=300" \
  -H "Authorization: Bearer $APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "people": [{
      "firstName": "Nathan",
      "lastName": "Jolly",
      "company": "4 Pines Brewing Company Pty Ltd",
      "jobTitle": "Brand Manager"
    }],
    "matchStrategy": "name_company_job_title"
  }'
```

Both return flat JSON rows ready for CSV conversion (`?format=csv` also works on dataset endpoints).

## Option B — direct Mawsool API

Request a key: support@mawsool.tech

```bash
# Email → LinkedIn
curl -X POST https://rev-api.mawsool.tech/api/v1/lookup/deep-v2 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MAWSOOL_API_KEY" \
  -d '{"email":"jane.doe@acme.com"}'

# Name + company → LinkedIn
curl -X POST https://rev-api.mawsool.tech/api/v1/lookup/info \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MAWSOOL_API_KEY" \
  -d '{
    "firstName": "Nathan",
    "lastName": "Jolly",
    "company": "4 Pines Brewing Company Pty Ltd",
    "jobTitle": "Brand Manager",
    "infoMatchStrategy": "name_company_job_title"
  }'
```
