import { Types } from 'mongoose';

export function getUniqueArray(arr: any[]) {
    return Array.from(new Set(arr));
}

export function getUniqueObjectIds(arr: any[]): any[] {
    return [...new Set(arr.map((id) => id.toHexString()))].map((id) => new Types.ObjectId(id));
}

export function convertObjectToArray(obj: { [key: string]: unknown }) {
    const result: unknown[] = [];
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            result.push(obj[key]);
        }
    }
    return result;
}

export function convertArrayToBatches(array: any[], batchSize: number): any[][] {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
}