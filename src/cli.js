import { readFile, writeFile } from 'node:fs/promises';
import { lookupEmail, lookupPerson } from './api.js';
import { lookupEmailsViaApify, lookupPeopleViaApify } from './apify.js';
import { parseCsv, toCsv } from './csv.js';

const HELP = `
mawsool - CRM enrichment CLI (emails / names -> verified LinkedIn profiles)

USAGE
  mawsool email <email> [more emails...]         Reverse email lookup
  mawsool person --first <f> --last <l> --company <c>
                 [--title <jobTitle>] [--url <linkedinUrl>]
                 [--strategy <matchStrategy>]    Find LinkedIn by name + company
  mawsool csv <input.csv> [--out <enriched.csv>]
                 [--strategy <matchStrategy>]    Bulk-enrich a CRM export

OPTIONS
  --json          Print raw JSON instead of a summary
  --out <file>    Write results to a CSV file (csv command)
  --cloud         Force cloud mode (Apify) even if MAWSOOL_API_KEY is set

AUTH (one of)
  MAWSOOL_API_KEY   Direct API access (contact support@mawsool.tech)
  APIFY_TOKEN       Run the hosted Actors on Apify - pay per result, no key needed:
                    https://apify.com/oday/mawsool-email-linkedin-lookup
                    https://apify.com/oday/mawsool-linkedin-profile-finder

CSV FORMAT
  Email lists:  a column named "email"
  People lists: columns "firstName,lastName,company" (+ optional "jobTitle,linkedinUrl")

EXAMPLES
  mawsool email jane.doe@acme.com
  mawsool person --first Nathan --last Jolly --company "4 Pines Brewing Company Pty Ltd"
  mawsool csv crm-contacts.csv --out crm-contacts-enriched.csv
`;

function parseArgs(argv) {
    const args = { _: [], flags: {} };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a.startsWith('--')) {
            const key = a.slice(2);
            const next = argv[i + 1];
            if (next !== undefined && !next.startsWith('--')) {
                args.flags[key] = next;
                i++;
            } else {
                args.flags[key] = true;
            }
        } else {
            args._.push(a);
        }
    }
    return args;
}

function resolveAuth(flags) {
    const mawsoolKey = process.env.MAWSOOL_API_KEY;
    const apifyToken = process.env.APIFY_TOKEN;
    if (flags.cloud && apifyToken) return { mode: 'apify', apifyToken };
    if (mawsoolKey && !flags.cloud) return { mode: 'direct', mawsoolKey };
    if (apifyToken) return { mode: 'apify', apifyToken };
    console.error(`No credentials found. Choose one:

  1. Cloud (fastest to start) - free Apify account, pay per result:
       Get a token at https://console.apify.com/settings/integrations
       then:  set APIFY_TOKEN=<your token>
       Actors: https://apify.com/oday/mawsool-email-linkedin-lookup
               https://apify.com/oday/mawsool-linkedin-profile-finder

  2. Direct API - request a key from support@mawsool.tech
       then:  set MAWSOOL_API_KEY=<your key>
`);
    process.exit(1);
}

function printEmailResult(r) {
    if (r.hasLinkedIn && r.profile) {
        console.log(`${r.email}  MATCH (${r.matchType})`);
        console.log(`  Name:     ${r.profile.displayName || ''}`);
        console.log(`  Headline: ${r.profile.headline || ''}`);
        console.log(`  Company:  ${r.profile.company || ''}`);
        console.log(`  Location: ${r.profile.location || ''}`);
        console.log(`  LinkedIn: ${r.profile.profileUrl || ''}`);
    } else {
        console.log(`${r.email}  NO MATCH (${r.matchType || 'none'})`);
    }
}

function printPersonResult(r) {
    const who = `${r.firstName || ''} ${r.lastName || ''} @ ${r.company || ''}`.trim();
    if (r.hasLinkedIn && r.profile) {
        console.log(`${who}  MATCH (${r.matchType})`);
        console.log(`  Name:     ${r.profile.displayName || ''}`);
        console.log(`  Headline: ${r.profile.headline || ''}`);
        console.log(`  Location: ${r.profile.location || ''}`);
        console.log(`  LinkedIn: ${r.profile.profileUrl || ''}`);
    } else {
        console.log(`${who}  NO MATCH (${r.matchType || 'none'})`);
    }
}

// Flat row shape shared by both direct-API results and Apify dataset rows.
function flattenEmailResult(r) {
    return {
        email: r.email || '',
        hasLinkedIn: r.hasLinkedIn ?? false,
        matchType: r.matchType || '',
        fullName: r.profile?.displayName ?? r.fullName ?? '',
        headline: r.profile?.headline ?? r.headline ?? '',
        company: r.profile?.company ?? r.company ?? '',
        location: r.profile?.location ?? r.location ?? '',
        linkedinUrl: r.profile?.profileUrl ?? r.linkedinUrl ?? '',
    };
}

function flattenPersonResult(r) {
    return {
        firstName: r.firstName || '',
        lastName: r.lastName || '',
        company: r.company || '',
        jobTitle: r.jobTitle || '',
        hasLinkedIn: r.hasLinkedIn ?? false,
        matchType: r.matchType || '',
        fullName: r.profile?.displayName ?? r.fullName ?? '',
        headline: r.profile?.headline ?? r.headline ?? '',
        location: r.profile?.location ?? r.location ?? '',
        linkedinUrl: r.profile?.profileUrl ?? r.linkedinUrl ?? '',
    };
}

async function cmdEmail(args, auth) {
    const emails = args._.slice(1);
    if (emails.length === 0) throw new Error('Provide at least one email. Example: mawsool email jane@acme.com');

    let results;
    if (auth.mode === 'apify') {
        results = await lookupEmailsViaApify(emails, auth.apifyToken);
    } else {
        results = [];
        for (const email of emails) {
            results.push(await lookupEmail(email, auth.mawsoolKey));
        }
    }

    if (args.flags.json) {
        console.log(JSON.stringify(results, null, 2));
    } else {
        results.forEach((r) => printEmailResult(auth.mode === 'apify' ? { ...r, profile: r.linkedinUrl ? { displayName: r.fullName, headline: r.headline, company: r.company, location: r.location, profileUrl: r.linkedinUrl } : null } : r));
    }
}

async function cmdPerson(args, auth) {
    const f = args.flags;
    if (!f.first || !f.last || !f.company) {
        throw new Error('person requires --first, --last and --company.');
    }
    const person = {
        firstName: f.first,
        lastName: f.last,
        company: f.company,
        jobTitle: f.title || '',
        linkedinUrl: f.url || '',
        matchStrategy: f.strategy || (f.url ? 'linkedin_url' : 'name_company_job_title'),
    };

    let result;
    if (auth.mode === 'apify') {
        const rows = await lookupPeopleViaApify([person], person.matchStrategy, auth.apifyToken);
        result = rows[0] || {};
        if (result.linkedinUrl) {
            result.profile = { displayName: result.fullName, headline: result.headline, location: result.location, profileUrl: result.linkedinUrl };
        }
    } else {
        result = await lookupPerson(person, auth.mawsoolKey);
    }

    if (args.flags.json) {
        console.log(JSON.stringify(result, null, 2));
    } else {
        printPersonResult(result);
    }
}

async function cmdCsv(args, auth) {
    const file = args._[1];
    if (!file) throw new Error('Provide a CSV file. Example: mawsool csv contacts.csv --out enriched.csv');

    const text = await readFile(file, 'utf8');
    const { headers, records } = parseCsv(text);
    if (records.length === 0) throw new Error('CSV file has no data rows.');

    const lower = headers.map((h) => h.toLowerCase());
    const isEmailList = lower.includes('email');
    const isPeopleList = lower.includes('firstname') && lower.includes('lastname') && lower.includes('company');
    if (!isEmailList && !isPeopleList) {
        throw new Error('CSV must have an "email" column, or "firstName,lastName,company" columns.');
    }

    const col = (rec, name) => {
        const key = headers.find((h) => h.toLowerCase() === name.toLowerCase());
        return key ? rec[key] : '';
    };

    let flat;
    if (isEmailList) {
        const emails = records.map((r) => col(r, 'email')).filter(Boolean);
        console.error(`Enriching ${emails.length} emails...`);
        if (auth.mode === 'apify') {
            const rows = await lookupEmailsViaApify(emails, auth.apifyToken);
            flat = rows.map(flattenEmailResult);
        } else {
            flat = [];
            for (const email of emails) {
                flat.push(flattenEmailResult(await lookupEmail(email, auth.mawsoolKey)));
                console.error(`  ${flat.length}/${emails.length}`);
            }
        }
    } else {
        const strategy = args.flags.strategy || 'name_company_job_title';
        const people = records.map((r) => ({
            firstName: col(r, 'firstName'),
            lastName: col(r, 'lastName'),
            company: col(r, 'company'),
            jobTitle: col(r, 'jobTitle'),
            linkedinUrl: col(r, 'linkedinUrl'),
        })).filter((p) => p.firstName && p.lastName && p.company);
        console.error(`Enriching ${people.length} people (strategy: ${strategy})...`);
        if (auth.mode === 'apify') {
            const rows = await lookupPeopleViaApify(people, strategy, auth.apifyToken);
            flat = rows.map(flattenPersonResult);
        } else {
            flat = [];
            for (const p of people) {
                flat.push(flattenPersonResult(await lookupPerson({ ...p, matchStrategy: strategy }, auth.mawsoolKey)));
                console.error(`  ${flat.length}/${people.length}`);
            }
        }
    }

    const outHeaders = Object.keys(flat[0]);
    const csv = toCsv(outHeaders, flat);
    const out = args.flags.out;
    if (out) {
        await writeFile(out, csv, 'utf8');
        const matched = flat.filter((r) => r.hasLinkedIn === true || r.hasLinkedIn === 'true').length;
        console.error(`Done: ${matched}/${flat.length} matched. Wrote ${out}`);
    } else {
        process.stdout.write(csv);
    }
}

export async function main(argv) {
    const args = parseArgs(argv);
    const command = args._[0];

    if (!command || args.flags.help || command === 'help') {
        console.log(HELP);
        return;
    }

    const auth = resolveAuth(args.flags);

    switch (command) {
        case 'email':
            return cmdEmail(args, auth);
        case 'person':
            return cmdPerson(args, auth);
        case 'csv':
            return cmdCsv(args, auth);
        default:
            console.log(HELP);
            throw new Error(`Unknown command: ${command}`);
    }
}
