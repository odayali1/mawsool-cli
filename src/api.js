// Thin HTTP client for the Mawsool lookup API.
// No matching logic lives here - all intelligence runs on Mawsool's cloud.

const DEFAULT_BASE_URL = 'https://rev-api.mawsool.tech';

function baseUrl() {
    return (process.env.MAWSOOL_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

async function post(path, body, apiKey) {
    const res = await fetch(`${baseUrl()}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
        },
        body: JSON.stringify(body),
    });

    if (res.status === 401) throw new Error('Invalid or disabled MAWSOOL_API_KEY (HTTP 401).');
    if (res.status === 402) throw new Error('Insufficient Mawsool credits (HTTP 402).');
    if (res.status === 429) throw new Error('Rate limit exceeded (HTTP 429) - retry later or lower concurrency.');

    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(data?.error || `Mawsool API error (HTTP ${res.status}).`);
    }
    return data;
}

/** Reverse email lookup: email -> verified LinkedIn profile. */
export function lookupEmail(email, apiKey) {
    return post('/api/v1/lookup/deep-v2', { email }, apiKey);
}

/** Info lookup: first name + last name + company (+ optional jobTitle / linkedinUrl) -> LinkedIn profile. */
export function lookupPerson(person, apiKey) {
    const body = {
        firstName: person.firstName,
        lastName: person.lastName,
        company: person.company,
    };
    if (person.jobTitle) body.jobTitle = person.jobTitle;
    if (person.linkedinUrl) body.linkedinUrl = person.linkedinUrl;
    if (person.matchStrategy) body.infoMatchStrategy = person.matchStrategy;
    return post('/api/v1/lookup/info', body, apiKey);
}
