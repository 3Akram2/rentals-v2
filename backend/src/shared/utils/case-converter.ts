export function camelToSnake(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map((item) => camelToSnake(item));
    }

    if (typeof obj === 'object') {
        const converted: any = {};
        for (const key in obj) {
            const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
            converted[snakeKey] = camelToSnake(obj[key]);
        }
        return converted;
    }

    return obj;
}
