import { BadRequestException } from '@nestjs/common';
import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js/max';

/**
 * Checks if the provided phone number is valid.
 * Phone number should be in the format "+[country code][phone number]".
 *
 * @param fullPhoneNumber The full phone number to validate. Example: "+201213995770"
 * @returns True if the phone number is valid, false otherwise.
 */
export function isValidPhone(fullPhoneNumber: string) {
    return isValidPhoneNumber(fullPhoneNumber);
}

/**
 * Phone number should be in the format "+[country code][phone number]".
 * @param fullPhoneNumber The full phone number to validate. Example: "+201213995770"
 */
export function splitPhoneNumber(fullPhoneNumber: string) {
    if (!isValidPhone(fullPhoneNumber)) throw new BadRequestException('Invalid phone number');

    const phoneNumber = parsePhoneNumberFromString(fullPhoneNumber);

    return {
        phoneCountryCode: `+${phoneNumber.countryCallingCode}`,
        localPhone: phoneNumber.nationalNumber,
    };
}

/**
 * Phone number should be in the format "+[country code][phone number]".
 * @param countryCode Example: "+20"
 * @param localPhone Example: "1213995770"
 */
export function assemblePhoneNumber(countryCode: string, localPhone: string) {
    const fullPhoneNumber = countryCode + localPhone;

    if (isValidPhone(fullPhoneNumber)) return fullPhoneNumber;
    else throw new BadRequestException('Invalid phone number');
}
