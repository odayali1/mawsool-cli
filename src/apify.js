// Cloud mode: run the hosted Mawsool Actors on Apify with your APIFY_TOKEN.
// No Mawsool API key needed - billing is pay-per-result through Apify.
//
// Email Actor:   https://apify.com/oday/mawsool-email-linkedin-lookup
// Profile Actor: https://apify.com/oday/mawsool-linkedin-profile-finder

const APIFY_BASE = 'https://api.apify.com/v2';
const EMAIL_ACTOR = 'oday~mawsool-email-linkedin-lookup';
const PROFILE_ACTOR = 'oday~mawsool-linkedin-profile-finder';

async function runActorSync(actorId, input, token) {
    const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?timeout=300&memory=1024`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
    });
    if (res.status === 401) throw new Error('Invalid APIFY_TOKEN (HTTP 401). Get one free at https://console.apify.com/settings/integrations');
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(data?.error?.message || `Apify API error (HTTP ${res.status}).`);
    }
    return Array.isArray(data) ? data : [];
}

/** Run reverse email lookup on Apify. Returns flat dataset rows. */
export function lookupEmailsViaApify(emails, token) {
    return runActorSync(EMAIL_ACTOR, { emails }, token);
}

/** Run name + company lookup on Apify. Returns flat dataset rows. */
export function lookupPeopleViaApify(people, matchStrategy, token) {
    return runActorSync(PROFILE_ACTOR, { people, matchStrategy }, token);
}
