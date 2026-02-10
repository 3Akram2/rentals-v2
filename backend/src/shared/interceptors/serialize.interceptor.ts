import { UseInterceptors, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClassTransformOptions, plainToInstance } from 'class-transformer';

interface ClassConstructor {
    new (...args: any[]): any;
}

export function Serialize(dto: ClassConstructor, options: ClassTransformOptions = {}) {
    return UseInterceptors(new SerializeInterceptor(dto, options));
}

export class SerializeInterceptor implements NestInterceptor {
    constructor(
        private dto: any,
        private options: ClassTransformOptions,
    ) {}

    intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
        return handler.handle().pipe(
            map((data: any) => {
                return plainToInstance(this.dto, data, {
                    excludeExtraneousValues: true,
                    ...this.options,
                });
            }),
        );
    }
}
