const fs = require('fs');
const path = require('path');

const SHORTS_FILE = path.join(__dirname, '../shorts.json');

/**
 * Tạo ID ngẫu nhiên với độ dài tùy chỉnh
 */
function makeId(len = 6) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let s = '';
    for (let i = 0; i < len; i++) {
        s += chars[Math.floor(Math.random() * chars.length)];
    }
    return s;
}

/**
 * Thêm link rút gọn vào shorts.json
 * @param {string} longString Chuỗi dữ liệu đã nén (LZString)
 * @returns {string} ID rút gọn
 */
function addShortLink(longString) {
    let map = {};
    if (fs.existsSync(SHORTS_FILE)) {
        try {
            map = JSON.parse(fs.readFileSync(SHORTS_FILE, 'utf8'));
        } catch (e) {
            console.error('Error reading shorts.json, starting with empty map');
            map = {};
        }
    }

    // Kiểm tra xem chuỗi dữ liệu này đã có ID chưa
    for (const [id, long] of Object.entries(map)) {
        if (long === longString) {
            return id;
        }
    }

    // Tạo ID mới không trùng lặp
    let id = makeId();
    while (map[id]) id = makeId();
    
    map[id] = longString;
    
    // Ghi lại vào file shorts.json với định dạng đẹp
    fs.writeFileSync(SHORTS_FILE, JSON.stringify(map, null, 2));
    return id;
}

// Xử lý tham số dòng lệnh
const longString = process.argv[2];
if (!longString) {
    console.log('--- AAV Short Link Generator ---');
    console.log('Usage: node generate_short_link.js <compressed_data_string>');
    console.log('This script will add the data to shorts.json and return a short ID.');
    process.exit(0);
}

const id = addShortLink(longString);
console.log(`\n✅ Success!`);
console.log(`Short ID: ${id}`);
console.log(`Short URL: https://lucdai.github.io/AAV/s/${id}`);
console.log(`\nNote: Please commit and push the updated shorts.json to GitHub.`);
