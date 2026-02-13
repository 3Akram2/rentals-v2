import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorCodes, errorMessagesMapper } from './custom';
import { AuditService } from 'src/audit/audit.service';

@Catch()
@Injectable()
export class ErrorsFilter implements ExceptionFilter {
    private logger = new Logger(ErrorsFilter.name);

    constructor(
        private readonly httpAdapterHost: HttpAdapterHost,
        private readonly auditService: AuditService,
    ) {}

    catch(exception: Error, host: ArgumentsHost): void {
        this.logger.error(exception.message);
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();
        const language =
            ctx?.getRequest()?.headers['accept-language']?.length == 2
                ? ctx.getRequest().headers['accept-language']
                : 'en';
        const httpStatus =
            exception instanceof HttpException ? exception?.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        const req = ctx?.getRequest();
        const currentUser = req?.user;
        if (httpStatus === HttpStatus.UNAUTHORIZED || httpStatus === HttpStatus.FORBIDDEN) {
            void this.auditService.log({
                eventType: httpStatus === HttpStatus.UNAUTHORIZED ? 'auth.unauthorized' : 'auth.forbidden',
                severity: 'warn',
                actor: currentUser
                    ? {
                          userId: String(currentUser?._id || ''),
                          email: currentUser?.email,
                          username: currentUser?.username,
                          name: currentUser?.name,
                      }
                    : undefined,
                action: {
                    module: 'auth',
                    operation: httpStatus === HttpStatus.UNAUTHORIZED ? 'unauthorized' : 'forbidden',
                    status: 'fail',
                },
                http: {
                    method: req?.method,
                    path: req?.originalUrl || req?.url,
                    statusCode: httpStatus,
                },
                client: {
                    ip: req?.headers?.['x-forwarded-for'] || req?.ip || req?.socket?.remoteAddress,
                    userAgent: req?.headers?.['user-agent'] || '',
                },
            });
        }

        let responseBody;
        if (exception instanceof HttpException) {
            const errCode = ((exception as HttpException)?.getResponse() as HttpException).message;

            if (Array.isArray(errCode)) {
                responseBody = {
                    message: 'validation error',
                    errors: errCode,
                };
            } else {
                const errorMessage = errorMessagesMapper?.[errCode]?.[language] || errCode;

                responseBody = {
                    message: errorMessage,
                    errors: [errorMessage],
                };
            }
        } else {
            console.log({ exception });
            responseBody = {
                message: errorMessagesMapper[ErrorCodes.global.internalError][language],
            };
        }

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}
