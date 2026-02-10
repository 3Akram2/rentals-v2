import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { sanitizeFormData } from '../utils/object';

export const TransformAndValidateFormData = createParamDecorator(
    async ({ dtoType }: { dtoType: any }, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const body = request.body;

        sanitizeFormData(body);

        const transformedObject = plainToInstance(dtoType, body, {
            enableImplicitConversion: true,
        });

        const errors = await validate(transformedObject);
        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }

        return transformedObject;
    },
);
