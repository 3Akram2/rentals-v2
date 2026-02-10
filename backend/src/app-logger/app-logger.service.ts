import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { format, createLogger, transports, Logger } from 'winston';
import { getLoggerDateFormatter, preflightLogger } from 'src/shared/preflight.logger';
import { BASE_DIRECTORY } from 'src/main';
import { BASE_RUN_TIMESTAMP, Loggers } from 'src/shared/constants';
import { Request, Response, NextFunction } from 'express';
import * as accesslog from 'access-log';
import { ClsService } from 'nestjs-cls';

// eslint-disable-next-line @typescript-eslint/no-var-requires

@Injectable()
export class AppLoggerService implements LoggerService {
    private logger: Logger;
    private accessLogger: Logger;
    private warningLogger: Logger;
    private loggerOptions: any;
    private namespaces = {};
    private level: number;
    private logsDir: string;
    private static readonly LEVELS = {
        off: 6,
        error: 5,
        warn: 4,
        info: 3,
        verbose: 2,
        debug: 1,
    };

    constructor(
        private configService: ConfigService,
        private readonly cls: ClsService,
    ) {
        this.loggerOptions = configService.get('logger');
        if (this.loggerOptions.namespaces) {
            this.loggerOptions.namespaces.forEach((n: string) => {
                this.namespaces[n.split(':')[0]] = AppLoggerService.LEVELS[n.split(':')[1]];
            });
        }
        this.level = AppLoggerService.LEVELS[this.loggerOptions.level || 'info'];
        this.logsDir = path.resolve(BASE_DIRECTORY, 'runtime/logs', this.configService.get('instance'));
        this.initLogger();
        this.attachUnCaughtExceptionHandlers();
        this.monitorLogsDir();
    }

    isNamespaceLoggable(level: string, namespace: string | number) {
        const thresholdLevel = this.namespaces[namespace]
            ? Math.max(this.namespaces[namespace], this.level)
            : this.level;
        return AppLoggerService.LEVELS[level] >= thresholdLevel;
    }

    isPerformanceLoggerEnabled() {
        return (this.namespaces[Loggers.PerformanceLog] ?? AppLoggerService.LEVELS.off) < AppLoggerService.LEVELS.off;
    }

    attachUnCaughtExceptionHandlers() {
        process.on('unhandledRejection', (reason: any, p) => {
            if (this.isNamespaceLoggable('error', Loggers.MainApp)) {
                this.logger.error(`[${Loggers.MainApp}] Unhandled Rejection\n%s`, reason.stack || reason);
                this.warningLogger &&
                    this.warningLogger.error(`[${Loggers.MainApp}] Unhandled Rejection\n%s`, reason.stack || reason);
            }
        });

        process.on('uncaughtException', (error, origin) => {
            this.logger.error(`[${Loggers.MainApp}] Unhandled exception\n%s`, error);
            this.warningLogger &&
                this.warningLogger.error(`[${Loggers.MainApp}] Unhandled exception\n%s`, error.stack || error);
            // process.exit(1);//it is the default behavior and you can't prevent it; better practice it to CATCH exceptions
        });
    }

    initLogger() {
        this.logger = createLogger({
            // To see more detailed errors, change this to 'debug'
            level: 'silly',
            transports: this.getAppLogTransporters(),
        });

        if (this.loggerOptions.accessLogger) {
            this.accessLogger = createLogger({
                // To see more detailed errors, change this to 'debug'
                level: 'info',
                transports: this.getAccessLogTransporters(),
            });
        }

        if (this.loggerOptions.file) {
            this.warningLogger = createLogger({
                // To see more detailed errors, change this to 'debug'
                level: 'warn',
                transports: this.getWarningLogTransporters(),
            });
        }

        preflightLogger.info('APPLICATION LOGGER TAKEOVER CONTROL', Loggers.MainApp);
    }

    monitorLogsDir() {
        this.verbose(`monitoring ${this.logsDir}`, Loggers.Logger);
        if (this.loggerOptions.file) {
            setInterval(() => {
                if (!fs.existsSync(path.resolve(BASE_DIRECTORY, 'runtime/logs'))) {
                    fs.mkdirSync(path.resolve(BASE_DIRECTORY, 'runtime/logs'));
                }
                if (!fs.existsSync(this.logsDir)) {
                    fs.mkdirSync(this.logsDir, { recursive: true });
                    this.reInitLoggers();
                }
            }, 60000);
        }
    }

    reInitLoggers() {
        this.logger.clear();
        this.getAppLogTransporters().forEach((_logger) => this.logger.add(_logger));

        if (this.loggerOptions.accessLogger) {
            this.accessLogger.clear();
            this.getAccessLogTransporters().forEach((_logger) => this.accessLogger.add(_logger));
        }

        this.warningLogger.clear();
        this.getWarningLogTransporters().forEach((_logger) => this.warningLogger.add(_logger));

        this.error('logs directory was removed during runtime; re-initializing loggers.', '', Loggers.Logger);
    }

    getCommonFormats(useShorthandDateFormatter = true) {
        const commonFormat = [
            format.timestamp({
                format: this.loggerOptions.json ? undefined : getLoggerDateFormatter(useShorthandDateFormatter),
            }),
            format.splat(),
            format.simple(),
            format.errors({
                stack: true,
            }),
            format.printf(
                (info) => `${info.timestamp} ${this.cls?.get('requestId') || 'N/A'} [${info.level}]${info.message}`,
            ),
        ];
        if (this.loggerOptions.json) {
            commonFormat.push(format.json());
        }
        return commonFormat;
    }

    getAppLogTransporters() {
        const formats: any = [
            new transports.Console({
                handleExceptions: true,
                format: format.combine(
                    format.colorize({
                        level: true,
                    }),
                    ...this.getCommonFormats(),
                ),
            }),
        ];
        if (this.loggerOptions.file) {
            formats.push(
                new transports.File({
                    format: format.combine(...this.getCommonFormats()),
                    handleExceptions: true,
                    filename: `${this.logsDir}/${BASE_RUN_TIMESTAMP}_log.txt`,
                    maxsize: this.loggerOptions.file.fileSize || 4000000,
                    maxFiles: this.loggerOptions.file.filesCount || 15,
                }),
            );
        }
        return formats;
    }

    getWarningLogTransporters() {
        return [
            new transports.Console({
                handleExceptions: true,
                format: format.combine(
                    format.colorize({
                        level: true,
                    }),
                    ...this.getCommonFormats(),
                ),
            }),
            new transports.File({
                format: format.combine(...this.getCommonFormats()),
                handleExceptions: true,
                filename: `${this.logsDir}/${BASE_RUN_TIMESTAMP}_warning-log.txt`,
                maxsize: this.loggerOptions.file.fileSize || 4000000,
                maxFiles: this.loggerOptions.file.filesCount || 15,
            }),
        ];
    }

    getAccessLogTransporters() {
        const formats: any = [
            new transports.Console({
                handleExceptions: true,
                format: format.combine(
                    format.colorize({
                        level: true,
                    }),
                    ...this.getCommonFormats(false),
                ),
            }),
        ];
        if (this.loggerOptions.file) {
            formats.push(
                new transports.File({
                    format: format.combine(...this.getCommonFormats(false)),
                    handleExceptions: true,
                    filename: `${this.logsDir}/${BASE_RUN_TIMESTAMP}_access-log.txt`,
                    maxsize: this.loggerOptions.file.fileSize || 4000000,
                    maxFiles: this.loggerOptions.file.filesCount || 15,
                }),
            );
        }
        return formats;
    }

    error(message: any, ...optionalParams: any[]) {
        if (this.isNamespaceLoggable('error', optionalParams[1])) {
            let output;
            if (optionalParams[0]) {
                output = `[${optionalParams[1]}] [${optionalParams[0]}] ${message}`;
            } else {
                output = `[${optionalParams[1]}] ${message}`;
            }

            if (this.accessLogger && optionalParams[1] === Loggers.AccessLog) {
                this.accessLogger.error(` ${message}}`);
            }

            if (this.warningLogger) {
                this.warningLogger.error(output);
            } else {
                this.logger.error(output);
            }
        }
    }

    warn(message: any, ...optionalParams: any[]) {
        if (this.isNamespaceLoggable('warn', optionalParams[0])) {
            if (this.accessLogger && optionalParams[0] === Loggers.AccessLog) {
                this.accessLogger.warn(` ${message}`);
            } else if (this.warningLogger) {
                this.warningLogger.warn(`[${optionalParams[0]}] ${message}`);
            } else {
                this.logger.warn(`[${optionalParams[0]}] ${message}`);
            }
        }
    }

    debug?(message: any, ...optionalParams: any[]) {
        if (this.isNamespaceLoggable('debug', optionalParams[0])) {
            this.logger.debug(`[${optionalParams[0]}] ${message}`);
        }
    }

    verbose?(message: any, ...optionalParams: any[]) {
        if (this.isNamespaceLoggable('verbose', optionalParams[0])) {
            this.logger.verbose(`[${optionalParams[0]}] ${message}`);
        }
    }

    setLogLevels?(levels: LogLevel[]) {
        if (levels.length === 0) {
            this.level = AppLoggerService.LEVELS.off;
            return;
        }
        //'log' | 'error' | 'warn' | 'debug' | 'verbose'
        const lowestLevel = levels
            .map((l) => {
                if (l === 'log') {
                    return 'info';
                } else {
                    return l;
                }
            })
            .map((l) => AppLoggerService.LEVELS[l])
            .reduce((prev, curr) => Math.min(prev, curr));
        this.level = lowestLevel;
    }

    log(message: string, ...optionalParams: any[]) {
        if (optionalParams[0] && typeof optionalParams[0] === 'object') {
            this.logJsonObject(message, optionalParams[0]);
        } else {
            if (this.isNamespaceLoggable('info', optionalParams[0])) {
                if (this.accessLogger && optionalParams[0] === Loggers.AccessLog) {
                    this.accessLogger.info(` ${message}`);
                } else {
                    this.logger.info(`[${optionalParams[0]}] ${message}`);
                }
            }
        }
    }

    logJsonObject(filename: string, obj: any) {
        const outputFile = path.resolve(
            BASE_DIRECTORY,
            './runtime/logs',
            `${this.configService.get('instance')}_${BASE_RUN_TIMESTAMP}_${filename}-${Date.now()}.json`,
        );
        fs.writeFileSync(outputFile, JSON.stringify(obj, null, 2), {});
        this.log(`json object written to ${outputFile}`, Loggers.Logger);
    }

    isAccessLoggerActive(): boolean {
        return this.loggerOptions.accessLogger;
    }

    accessLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
        const started = process.hrtime.bigint();

        res.on('finish', () => {
            const delta = Number(process.hrtime.bigint() - started) / 1e6;

            const payload = {
                namespace: Loggers.AccessLog,
                ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string,
                method: req.method,
                statusCode: res.statusCode,
                elapsedTime: delta.toFixed(1) + 'ms',
                userAgent: req.headers['user-agent'] ?? '',
                path: req.originalUrl,
                userId: (req?.user as any)?._id || 'N/A',
            };

            const message = `from userId ${payload.userId} ${payload.ip} received http ${payload.method} ${payload.path} ${payload.statusCode} ${payload.elapsedTime} "${payload.userAgent}"`;

            if (res.statusCode < 400) {
                this.logger.info(message, payload);
            } else if (res.statusCode < 500) {
                this.logger.warn(message, payload);
            } else {
                this.logger.error(message, payload);
            }
        });

        next();
    }
}
