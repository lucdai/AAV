const fs = require('fs');
const path = require('path');

const SHORTS_FILE = path.join(__dirname, '../shorts.json');

function makeId(len = 6) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let s = '';
    for (let i = 0; i < len; i++) {
        s += chars[Math.floor(Math.random() * chars.length)];
    }
    return s;
}

function addShortLink(longString) {
    let map = {};
    if (fs.existsSync(SHORTS_FILE)) {
        map = JSON.parse(fs.readFileSync(SHORTS_FILE, 'utf8'));
    }

    // Check if already exists
    for (const [id, long] of Object.entries(map)) {
        if (long === longString) {
            return id;
        }
    }

    let id = makeId();
    while (map[id]) id = makeId();
    
    map[id] = longString;
    fs.writeFileSync(SHORTS_FILE, JSON.stringify(map, null, 2));
    return id;
}

const longString = process.argv[2];
if (!longString) {
    console.error('Usage: node generate_short_link.js <long_base64_string>');
    process.exit(1);
}

const id = addShortLink(longString);
console.log(`Short ID created: ${id}`);
console.log(`Short URL: https://lucdai.github.io/AAV/s/${id}`);
