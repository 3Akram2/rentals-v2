import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsAfter(property: string, validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
        registerDecorator({
            name: 'IsAfter',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    if (value instanceof Date && relatedValue instanceof Date) {
                        return value >= relatedValue;
                    }
                    return true;
                },
                defaultMessage(args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    return `${args.property} must be after ${relatedPropertyName}`;
                },
            },
        });
    };
}
