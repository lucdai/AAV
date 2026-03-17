#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const translationsPath = path.join(__dirname, '..', 'translations.json');
const raw = fs.readFileSync(translationsPath, 'utf8');
const translations = JSON.parse(raw);

const baseLocale = 'vi';
const locales = Object.keys(translations);

function getObjectSource(source, objectKey) {
    const marker = `"${objectKey}"`;
    const keyIndex = source.indexOf(marker);
    if (keyIndex === -1) return null;

    const openBraceIndex = source.indexOf('{', keyIndex);
    if (openBraceIndex === -1) return null;

    let depth = 0;
    let inString = false;
    let escaping = false;

    for (let i = openBraceIndex; i < source.length; i += 1) {
        const char = source[i];

        if (inString) {
            if (escaping) {
                escaping = false;
            } else if (char === '\\') {
                escaping = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '{') depth += 1;
        if (char === '}') {
            depth -= 1;
            if (depth === 0) {
                return source.slice(openBraceIndex, i + 1);
            }
        }
    }

    return null;
}

function findDuplicateKeysInLocale(source, locale) {
    const localeSource = getObjectSource(source, locale);
    if (!localeSource) return [];

    const keyRegex = /"((?:\\.|[^"\\])+)"\s*:/g;
    const seen = new Set();
    const duplicates = new Set();

    for (const match of localeSource.matchAll(keyRegex)) {
        const key = match[1];
        if (seen.has(key)) {
            duplicates.add(key);
        } else {
            seen.add(key);
        }
    }

    return Array.from(duplicates).sort();
}

const baseKeys = new Set(Object.keys(translations[baseLocale] || {}));
const errors = [];

for (const locale of locales) {
    const localeObj = translations[locale];
    const localeKeys = new Set(Object.keys(localeObj));

    const missing = Array.from(baseKeys).filter((key) => !localeKeys.has(key)).sort();
    const extra = Array.from(localeKeys).filter((key) => !baseKeys.has(key)).sort();
    const duplicates = findDuplicateKeysInLocale(raw, locale);

    if (missing.length || extra.length || duplicates.length) {
        errors.push({ locale, missing, extra, duplicates });
    }
}

if (errors.length) {
    console.error('❌ i18n coverage check failed.');
    for (const issue of errors) {
        console.error(`\nLocale: ${issue.locale}`);
        if (issue.missing.length) console.error(`  Missing keys (${issue.missing.length}): ${issue.missing.join(', ')}`);
        if (issue.extra.length) console.error(`  Extra keys (${issue.extra.length}): ${issue.extra.join(', ')}`);
        if (issue.duplicates.length) console.error(`  Duplicate keys (${issue.duplicates.length}): ${issue.duplicates.join(', ')}`);
    }
    process.exit(1);
}

console.log(`✅ i18n coverage check passed for ${locales.length} locales (${baseKeys.size} keys each).`);
