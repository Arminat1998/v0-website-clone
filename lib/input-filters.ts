// Filters for text inputs: characters that do not belong in a field are dropped while typing.

/** Digits only (KVK number, number of guests, house number). */
export const digitsOnly = (value: string) => value.replace(/\D/g, "")

/** Letters in any alphabet plus what names and places need: space, hyphen, apostrophe and period. */
export const lettersOnly = (value: string) => value.replace(/[^\p{L}\p{M} '’.-]/gu, "")

/** Phone numbers: digits with the usual separators. */
export const phoneChars = (value: string) => value.replace(/[^\d+\s()-]/g, "")

/** Postal codes: letters, digits and spaces, in capitals (1234 AB). */
export const postalCodeChars = (value: string) => value.replace(/[^\p{L}\d ]/gu, "").toUpperCase()

/** Ranges such as "1 - 8": digits, spaces and a hyphen. */
export const rangeChars = (value: string) => value.replace(/[^\d\s-]/g, "")
