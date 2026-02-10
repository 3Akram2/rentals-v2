const units = {
    k: 1000,
    m: 1000000,
    b: 1000000000,
};

export function convertStringToNumber(str: string) {
    const regex = /^(\d*\.?\d*)([kmb]?)$/i;
    const match = str.match(regex);

    if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2].toLowerCase();

        if (units[unit]) {
            return Math.floor(num * units[unit]);
        } else {
            return num;
        }
    } else {
        return NaN; // Invalid input
    }
}

export function calculateSkipLimitPagination(pagination: { page?: number; pageSize?: number }) {
    const { page, pageSize } = pagination;
    if (!pageSize) return {};
    return { skip: (page - 1) * pageSize, limit: pageSize };
}

export function generateRandomNumber(digits) {
    if (digits < 1) return 0;
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return Math.floor(min + Math.random() * (max - min + 1));
}

const SAFETY_FACTOR = 1_000_000_000;

export function sum(...numbers: number[]) {
    const result = numbers.reduce((final, num) => {
        return final + num * SAFETY_FACTOR;
    }, 0);

    return result / SAFETY_FACTOR;
}

export function multiply(...numbers: number[]) {
    const result = numbers.reduce((final, num) => {
        return (final * SAFETY_FACTOR * (num * SAFETY_FACTOR)) / (SAFETY_FACTOR * SAFETY_FACTOR);
    }, 1);

    return result;
}

export function devide(...numbers: number[]) {
    const result = numbers.reduce((final, num, index) => {
        if (!index) return num;
        return (final * SAFETY_FACTOR) / (num * SAFETY_FACTOR);
    }, null);

    return result;
}
