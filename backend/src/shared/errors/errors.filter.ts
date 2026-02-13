import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorCodes, errorMessagesMapper } from './custom';

@Catch()
@Injectable()
export class ErrorsFilter implements ExceptionFilter {
    private logger = new Logger(ErrorsFilter.name);

    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

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
