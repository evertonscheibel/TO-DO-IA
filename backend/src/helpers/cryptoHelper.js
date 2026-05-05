const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

// Lazy-load key to avoid crashing at require() time if env var is missing
let _key = null;
function getKey() {
    if (_key) return _key;
    const raw = process.env.ACCESS_ENCRYPTION_KEY;
    if (!raw || raw.length !== 64) {
        throw new Error('ACCESS_ENCRYPTION_KEY inválida ou ausente');
    }
    _key = Buffer.from(raw, 'hex');
    return _key;
}

/**
 * Encrypts a string using AES-256-CBC
 * @param {string} text 
 * @returns {string} iv:encryptedText (or plain text if key is missing)
 */
exports.encrypt = (text) => {
    if (!text) return '';
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts a string formatted as iv:encryptedText
 * @param {string} encryptedText 
 * @returns {string}
 */
exports.decrypt = (encryptedText) => {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    const key = getKey();

    try {
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error.message);
        return '*** [Erro na Descriptografia] ***';
    }
};
