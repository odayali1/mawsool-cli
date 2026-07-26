// Minimal CSV parsing / serialization - enough for typical CRM exports.
// Handles quoted fields, commas and newlines inside quotes.

export function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ',') {
            row.push(field);
            field = '';
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            field = '';
            if (row.some((v) => v !== '')) rows.push(row);
            row = [];
        } else {
            field += c;
        }
    }
    row.push(field);
    if (row.some((v) => v !== '')) rows.push(row);

    if (rows.length === 0) return { headers: [], records: [] };
    const headers = rows[0].map((h) => h.trim());
    const records = rows.slice(1).map((r) => {
        const rec = {};
        headers.forEach((h, i) => {
            rec[h] = (r[i] ?? '').trim();
        });
        return rec;
    });
    return { headers, records };
}

function escapeCell(value) {
    const s = value == null ? '' : String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers, records) {
    const lines = [headers.map(escapeCell).join(',')];
    for (const rec of records) {
        lines.push(headers.map((h) => escapeCell(rec[h])).join(','));
    }
    return lines.join('\n') + '\n';
}
