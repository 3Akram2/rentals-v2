import { createLogger, format, transports } from 'winston';
import * as fs from 'fs';
import * as path from 'path';

import * as dotenv from 'dotenv';
import { BASE_RUN_TIMESTAMP, LOGGER_LOCALE, LOGGER_TIMEZONE } from './constants';
dotenv.config(); // as soon as possible

const longFormat: Intl.DateTimeFormatOptions = {
    timeZone: LOGGER_TIMEZONE,
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'shortGeneric',
};

const shortFormat: Intl.DateTimeFormatOptions = {
    timeZone: LOGGER_TIMEZONE,
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    // timeZoneName: 'shortGeneric',
    //@ts-ignore
    fractionalSecondDigits: 3,
};

export const getLoggerDateFormatter = (useShorthandDateFormatter = true) => {
    if (!useShorthandDateFormatter) {
        return 'DD/MM/YY HH:mm:ss.SSS';
    }
    let lastLoggedMinute = null;
    const fn = () => {
        const now = new Date();
        const minute = Math.trunc(now.getTime() / 60000);
        if (lastLoggedMinute !== minute) {
            lastLoggedMinute = minute;
            return `\n${now.toLocaleString(
                LOGGER_LOCALE,
                longFormat,
            )}\n${now.toLocaleString(LOGGER_LOCALE, shortFormat)}`;
        } else {
            return `${now.toLocaleString(LOGGER_LOCALE, shortFormat)}`;
        }
    };
    return fn;
};

const getCommonFormats = () => {
    return [
        format.timestamp({
            format: getLoggerDateFormatter(),
        }),
        format.splat(),
        format.simple(),
        // format.json(),//disable format.simple()
        format.errors({
            stack: true,
        }),
        format.printf((info) => `${info.timestamp} [${info.level}] ${info.message}`),
    ];
};

function getAppLogTransporters() {
    const logsDir = path.resolve(
        __dirname, //BASE_DIRECTORY is not available here yet
        '../runtime/logs',
        process.env.INSTANCE || 'main-1',
    );
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    return [
        new transports.Console({
            handleExceptions: true,
            format: format.combine(
                format.colorize({
                    level: true,
                }),
                ...getCommonFormats(),
            ),
        }),
        new transports.File({
            format: format.combine(...getCommonFormats()),
            handleExceptions: true,
            filename: `${logsDir}/${BASE_RUN_TIMESTAMP}_preflight.txt`,
        }),
    ];
}

export const preflightLogger = createLogger({
    level: 'silly',
    transports: getAppLogTransporters(),
});
