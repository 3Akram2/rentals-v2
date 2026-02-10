import { Transform } from 'class-transformer';

export function RemoveWhitespace() {
    return Transform(({ value }) => (value ? value.replace(/[\s\u200B]/g, '') : value));
}

export function Trim() {
    return Transform(({ value }) => value.trim());
}

export function NormalizeEmail() {
    return Transform(({ value }) => (value ? value.replace(/\s+/g, '').toLowerCase() : value));
}

export function ToLowerCase() {
    return Transform(({ value }) => (value ? value.toLowerCase() : value));
}

export function IgnoreIfNotExist() {
    return Transform(({ value, key, obj }) => {
        if (value === null || value === undefined) delete obj[key];
        else return value;
    });
}
