// Convert Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) and Eastern Arabic numerals (۰۱۲۳۴۵۶۷۸۹) to Western numerals
const arabicIndicNumerals = '٠١٢٣٤٥٦٧٨٩';
const easternArabicNumerals = '۰۱۲۳۴۵۶۷۸۹';
const westernNumerals = '0123456789';

// Convert Arabic numerals only (keeps other characters)
export function convertArabicNumerals(str) {
  if (!str && str !== 0) return '';
  let result = str.toString();

  // Convert Arabic-Indic numerals
  for (let i = 0; i < arabicIndicNumerals.length; i++) {
    result = result.replace(new RegExp(arabicIndicNumerals[i], 'g'), westernNumerals[i]);
  }

  // Convert Eastern Arabic numerals
  for (let i = 0; i < easternArabicNumerals.length; i++) {
    result = result.replace(new RegExp(easternArabicNumerals[i], 'g'), westernNumerals[i]);
  }

  // Convert Arabic decimal separator to Western
  result = result.replace(/٫/g, '.');

  return result;
}

// Convert Arabic numerals and strip non-numeric characters (for number inputs)
export function convertToNumber(str) {
  if (!str && str !== 0) return '';
  let result = convertArabicNumerals(str);
  // Only keep valid number characters (digits, decimal point, minus)
  result = result.replace(/[^\d.\-]/g, '');
  return result;
}

// Format number with comma thousands and 2 decimal places
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0.00';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Convert number to Arabic words
const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

export function numberToArabicWords(num) {
  if (num === 0) return 'صفر';
  if (num < 0) return 'سالب ' + numberToArabicWords(-num);

  num = Math.floor(num);

  if (num < 20) {
    return ones[num];
  }

  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    if (one === 0) {
      return tens[ten];
    }
    return ones[one] + ' و' + tens[ten];
  }

  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    if (remainder === 0) {
      return hundreds[hundred];
    }
    return hundreds[hundred] + ' و' + numberToArabicWords(remainder);
  }

  if (num < 10000) {
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;
    let thousandWord = '';
    if (thousand === 1) {
      thousandWord = 'ألف';
    } else if (thousand === 2) {
      thousandWord = 'ألفان';
    } else if (thousand >= 3 && thousand <= 10) {
      thousandWord = ones[thousand] + ' آلاف';
    } else {
      thousandWord = numberToArabicWords(thousand) + ' ألف';
    }

    if (remainder === 0) {
      return thousandWord;
    }
    return thousandWord + ' و' + numberToArabicWords(remainder);
  }

  // For larger numbers, just return the number
  return num.toString();
}

// English version
const onesEn = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tensEn = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export function numberToEnglishWords(num) {
  if (num === 0) return 'zero';
  if (num < 0) return 'negative ' + numberToEnglishWords(-num);

  num = Math.floor(num);

  if (num < 20) {
    return onesEn[num];
  }

  if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    if (one === 0) {
      return tensEn[ten];
    }
    return tensEn[ten] + '-' + onesEn[one];
  }

  if (num < 1000) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    if (remainder === 0) {
      return onesEn[hundred] + ' hundred';
    }
    return onesEn[hundred] + ' hundred and ' + numberToEnglishWords(remainder);
  }

  if (num < 10000) {
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;
    if (remainder === 0) {
      return numberToEnglishWords(thousand) + ' thousand';
    }
    return numberToEnglishWords(thousand) + ' thousand ' + numberToEnglishWords(remainder);
  }

  return num.toString();
}
