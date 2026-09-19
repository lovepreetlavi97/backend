"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMediaKey = normalizeMediaKey;
exports.normalizeMediaKeyList = normalizeMediaKeyList;
function normalizeMediaKey(input) {
    if (!input || typeof input !== 'string')
        return '';
    let str = input.trim();
    if (!str)
        return '';
    if (str.includes('/uploads/')) {
        str = str.split('/uploads/')[1];
    }
    else if (str.startsWith('http://') || str.startsWith('https://')) {
        try {
            const url = new URL(str);
            str = url.pathname;
            if (str.includes('/uploads/')) {
                str = str.split('/uploads/')[1];
            }
        }
        catch {
        }
    }
    str = str.replace(/^\/+/, '');
    if (str.startsWith('uploads/')) {
        str = str.replace(/^uploads\//, '');
    }
    return str.trim();
}
function normalizeMediaKeyList(inputs) {
    if (!Array.isArray(inputs))
        return [];
    return inputs
        .map((img) => normalizeMediaKey(img))
        .filter((img) => img.length > 0);
}
//# sourceMappingURL=storage.util.js.map