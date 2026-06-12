import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const csvPath = 'C:/Users/Roger Rajaratnam.DESKTOP-TATD8K7/Downloads/SW - Nioh 2 _ Item list - IDS -Equipment,items.csv';
const outPath = 'src/data/items.json';

// Get original file from git
const original = execSync('git show HEAD:src/data/items.json').toString();

// Extract only top-level key order from raw text (4-space indent = top level)
// This avoids JS integer-key reordering
const origKeyOrder = [...original.matchAll(/^    "([^"]+)"\s*:/mg)].map(m => m[1]);

// Parse original values
const origParsed = JSON.parse(original);

// Build CSV lookup: A.Mode -> { name, type }
// Use a proper CSV parser to handle quoted fields with embedded commas/quotes
const csvLines = readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);
const csvMap = {};
function parseCSVLine(line) {
    const cols = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
            else inQuote = !inQuote;
        } else if (ch === ',' && !inQuote) {
            cols.push(cur); cur = '';
        } else {
            cur += ch;
        }
    }
    cols.push(cur);
    return cols;
}
for (const line of csvLines) {
    const cols = parseCSVLine(line);
    const id = cols[2]?.trim();
    const name = cols[3]?.trim();
    const type = cols[4]?.trim();
    if (id && name && type) csvMap[id] = { name, type };
}

// Report any changes to existing items
let changedCount = 0;
for (const key of origKeyOrder) {
    const orig = origParsed[key];
    const csv = csvMap[key];
    if (!csv) continue;
    if (orig.name !== csv.name || orig.type !== csv.type) {
        console.log(`CHANGED [${key}]: "${orig.name}" (${orig.type}) -> "${csv.name}" (${csv.type})`);
        changedCount++;
    }
}
console.log(`\n${changedCount} existing items changed.`);

// Build ordered entries: originals in original order, then new ones appended
const seen = new Set(origKeyOrder);
const entries = origKeyOrder.map(key => [key, csvMap[key] ?? origParsed[key]]);
let newCount = 0;
for (const key of Object.keys(csvMap)) {
    if (!seen.has(key)) {
        entries.push([key, csvMap[key]]);
        newCount++;
    }
}
console.log(`${newCount} new items appended.`);
console.log(`Total: ${entries.length}`);

// Write output — manually build JSON string to preserve key order
const jsonLines = entries.map(([k, v]) =>
    `    ${JSON.stringify(k)}: ${JSON.stringify(v, null, 4).replace(/\n/g, '\n    ')}`
);
writeFileSync(outPath, '{\n' + jsonLines.join(',\n') + '\n}\n', 'utf8');
console.log('\nDone. items.json updated.');
