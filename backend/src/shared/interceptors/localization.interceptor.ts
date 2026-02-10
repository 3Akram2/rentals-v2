import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class LocalizationInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const preferredLanguage =
            request.headers['accept-language']?.length == 2 ? request.headers['accept-language'] : 'en';
        return next.handle().pipe(map((data) => this.localizeFields(data, preferredLanguage, 1)));
    }

    private localizeFields(data: any, preferredLanguage: string, level: number): any {
        if (level > 10) {
            // Stop recursion if level is greater than 10
            return data;
        }

        if (Array.isArray(data)) {
            return data.map((item) => this.localizeObject(item, preferredLanguage, level + 1));
        } else if (typeof data === 'object' && data !== null) {
            return this.localizeObject(data, preferredLanguage, level + 1);
        }
        return data;
    }

    private localizeObject(obj: any, preferredLanguage: string, level: number): any {
        obj &&
            Object.keys(obj).forEach((key) => {
                if (key.endsWith(`_${preferredLanguage}`) && Array.isArray(obj[key])) {
                    const arrayValue = obj[key];
                    if (arrayValue.every((item) => typeof item === 'string')) {
                        const baseKey = key.slice(0, -3);
                        obj[baseKey] = arrayValue;
                    }
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    obj[key] = this.localizeFields(obj[key], preferredLanguage, level + 1);
                } else if (key.endsWith(`_${preferredLanguage}`)) {
                    const baseKey = key.slice(0, -3); // Remove the language postfix
                    obj[baseKey] = obj[key];
                }
            });
        return obj;
    }
}
