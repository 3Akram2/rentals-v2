export function notNull(value: any): boolean {
    return !!value;
}

export function notEmptyArray(value: any): boolean {
    return !!(!Array.isArray(value) || value?.length);
}
