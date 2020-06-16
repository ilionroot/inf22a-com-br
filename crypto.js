const crypto = require('crypto');
const a = 'aes-256-ctr';
const p = 'abcdabcd';
        
function crypt(text) {
    const cipher = crypto.createCipher(a, p);
    const crypted = cipher.update(text, 'utf-8', 'hex');

    return crypted;
}

function decrypt(text) {
    const decipher = crypto.createDecipher(a, p);
    const plain = decipher.update(text, 'utf-8', 'hex');
    return plain;
}

module.exports = {
    crypt: crypt,
    decrypt: decrypt
}