import { InternalServerErrorException, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';

const FSHelperLogger = new Logger('FSHelper');

export function checkDirectoryExistence(targetDirectory: string) {
    if (!existsSync(targetDirectory)) {
        try {
            mkdirSync(targetDirectory, { recursive: true });
            FSHelperLogger.log(`Directory ${targetDirectory} created successfully.`);
        } catch (mkdirErr) {
            throw new InternalServerErrorException(mkdirErr.message);
        }
    }
}

export function generateRandomFileName() {
    return Date.now() + randomBytes(2).toString('base64');
}

export function getHighestKey(obj) {
    return Object.keys(obj).reduce((highestKey, key) => {
        highestKey = highestKey || key;
        if (obj[highestKey] < obj[key]) highestKey = key;
        return highestKey;
    }, '');
}
