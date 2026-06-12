import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const csvPath = 'C:/Users/Roger Rajaratnam.DESKTOP-TATD8K7/Downloads/SW - Nioh 2 _ Item list - IDs-Special Effects.csv';
const outPath = 'src/data/effects.json';

// Get original file from git
const original = execSync('git show HEAD:src/data/effects.json').toString();
const origArray = JSON.parse(original);

// Build lookup from original by id
const origMap = new Map(origArray.map(e => [e.id, e]));

// Proper CSV line parser (handles quoted fields with embedded commas/quotes)
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

// Build CSV lookup: Q.Mode -> { Effect, CAP, rarity }
const csvLines = readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);
const csvMap = new Map();
for (const line of csvLines) {
    const cols = parseCSVLine(line);
    const id = cols[1]?.trim();       // Q.Mode
    const effect = cols[3]?.trim();   // Skill Names(English)
    const capRaw = cols[4]?.trim();   // Cap Value
    const rarity = cols[5]?.trim();   // Rarity
    if (!id || !effect) continue;

    // Convert percentage string to decimal, preserving original precision
    let cap;
    if (capRaw?.match(/^-?[\d.]+\s*%$/)) {
        const num = parseFloat(capRaw) / 100;
        // Round to avoid floating-point noise (max 6 significant digits)
        cap = String(parseFloat(num.toPrecision(6)));
    } else if (capRaw?.match(/^-?[\d]+\.0+$/)) {
        // Strip trailing .0 from whole numbers (e.g. "4.0" -> "4")
        cap = String(parseInt(capRaw));
    } else {
        cap = capRaw ?? '';
    }
    csvMap.set(id, { Effect: effect, CAP: cap, rarity, id });
}

// Report changes to existing entries
let changedCount = 0;
for (const orig of origArray) {
    const csv = csvMap.get(orig.id);
    if (!csv) continue;
    const changes = [];
    if (orig.Effect !== csv.Effect) changes.push(`Effect: "${orig.Effect}" -> "${csv.Effect}"`);
    if (orig.CAP !== csv.CAP) changes.push(`CAP: "${orig.CAP}" -> "${csv.CAP}"`);
    if (orig.rarity !== csv.rarity) changes.push(`rarity: "${orig.rarity}" -> "${csv.rarity}"`);
    if (changes.length) {
        console.log(`CHANGED [${orig.id}]: ${changes.join(', ')}`);
        changedCount++;
    }
}
console.log(`\n${changedCount} existing effects changed.`);

// Build ordered array: originals in original order, then new ones appended
const seen = new Set(origArray.map(e => e.id));
const entries = origArray.map(e => csvMap.get(e.id) ?? e);
let newCount = 0;
for (const [id, entry] of csvMap) {
    if (!seen.has(id)) {
        entries.push(entry);
        newCount++;
    }
}
console.log(`${newCount} new effects appended.`);
console.log(`Total: ${entries.length}`);

writeFileSync(outPath, JSON.stringify(entries, null, 4), 'utf8');
console.log('\nDone. effects.json updated.');
