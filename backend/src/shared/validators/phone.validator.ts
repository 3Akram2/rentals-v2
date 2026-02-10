// alphanumeric.validator.ts

import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

import { isValidPhoneNumber } from 'libphonenumber-js/max';

@ValidatorConstraint()
export class IsValidPhoneNumberConstraint implements ValidatorConstraintInterface {
    validate(phone: string) {
        return isValidPhoneNumber(phone);
    }

    defaultMessage() {
        return 'invalid phone number';
    }
}

export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
    return function (object: unknown, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidPhoneNumberConstraint,
        });
    };
}
