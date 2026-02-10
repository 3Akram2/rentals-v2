import mongoose from 'mongoose';

export function flattenObject(obj: object, parentKey = '') {
    const flattenedObject = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = parentKey ? `${parentKey}.${key}` : key;

            if (obj[key] instanceof Date) {
                flattenedObject[newKey] = obj[key];
            } else if (Array.isArray(obj[key])) {
                flattenedObject[newKey] = obj[key];
            } else if (mongoose.isValidObjectId(obj[key])) {
                flattenedObject[newKey] = obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                Object.assign(flattenedObject, flattenObject(obj[key], newKey));
            } else {
                flattenedObject[newKey] = obj[key];
            }
        }
    }

    return flattenedObject;
}

export function convertFlattenToNestedObject(obj: any) {
    const result = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const parts = key.split('.');
            let currentLevel = result;

            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                // Initialize a new object if the current level doesn't have this part
                if (!currentLevel[part]) {
                    currentLevel[part] = {};
                }
                currentLevel = currentLevel[part];
            }

            // Set the value at the last part of the key
            currentLevel[parts[parts.length - 1]] = obj[key];
        }
    }

    return result;
}

export function isObjectEmpty(obj: object) {
    return Object.keys(obj).length === 0;
}

export function sanitizeFormData(obj: unknown): unknown {
    if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
            if (value === 'true') {
                obj[key] = true;
            } else if (value === 'false') {
                obj[key] = false;
            } else if (value === 'undefined') {
                delete obj[key];
            } else if (typeof value === 'object') {
                // Recursively handle nested objects or arrays
                obj[key] = sanitizeFormData(value);
            }
        }
    }
    return obj;
}
