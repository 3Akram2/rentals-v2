import * as crypto from 'crypto';

export function encryptAES(
    data: string,
    key: crypto.CipherKey = '97a51095f0d35d5ae2bb665ea8dbef3f',
    iv: crypto.BinaryLike | null = '9285d9312c8c428f',
): string {
    if (!data) {
        return data;
    }
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let msg = cipher.update(data, 'utf8', 'base64');
    msg += cipher.final('base64');
    return msg;
}

export function decryptAES(
    data: string,
    key: crypto.CipherKey = '97a51095f0d35d5ae2bb665ea8dbef3f',
    iv: crypto.BinaryLike | null = '9285d9312c8c428f',
): string {
    if (!data) {
        return data;
    }
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let msg = decipher.update(data, 'base64', 'utf8');
    msg += decipher.final('utf8');
    return msg;
}

export function hmac(
    dataString: crypto.BinaryLike,
    algorithm = 'sha1',
    key: crypto.BinaryLike | crypto.KeyObject = '97a51095f0d35d5ae2bb665ea8dbef3f',
    format: BufferEncoding = 'base64',
): string {
    // hmac.digest([encoding])
    // If encoding is provided a string is returned; otherwise a Buffer is returned;
    return crypto.createHmac(algorithm, key).update(dataString).digest().toString(format);
}

export function hmacSHA1Base64(
    dataString: crypto.BinaryLike,
    key: crypto.BinaryLike | crypto.KeyObject = '97a51095f0d35d5ae2bb665ea8dbef3f',
): string {
    // hmac.digest([encoding])
    // If encoding is provided a string is returned; otherwise a Buffer is returned;
    return hmac(dataString, 'sha1', key, 'base64');
}

export function hmacSHA256Base64(
    dataString: crypto.BinaryLike,
    key: crypto.BinaryLike | crypto.KeyObject = '97a51095f0d35d5ae2bb665ea8dbef3f',
): string {
    // hmac.digest([encoding])
    // If encoding is provided a string is returned; otherwise a Buffer is returned;
    return hmac(dataString, 'sha256', key, 'base64');
}
