/**
 * Indian Number to Words Formatter
 * Formats monetary amounts in Indian Rupees (INR) to English words.
 * Handles Crores, Lakhs, Thousands, Hundreds, and Paise.
 *
 * Example: 3000 -> "Three Thousand Rupees Only"
 * Example: 520 -> "Five Hundred Twenty Rupees Only"
 */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertBelowThousand(num: number): string {
  let str = "";
  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 20) {
    str += TENS[Math.floor(num / 10)] + " ";
    num %= 10;
  }
  if (num > 0) {
    str += ONES[num] + " ";
  }
  return str.trim();
}

export function numberToIndianRupeesWords(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return "Zero Rupees Only";
  }

  const absoluteAmount = Math.abs(amount);
  const rupees = Math.floor(absoluteAmount);
  const paise = Math.round((absoluteAmount - rupees) * 100);

  let rupeesStr = "";
  let remaining = rupees;

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;

  const hundreds = remaining;

  if (crore > 0) {
    rupeesStr += convertBelowThousand(crore) + " Crore ";
  }
  if (lakh > 0) {
    rupeesStr += convertBelowThousand(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    rupeesStr += convertBelowThousand(thousand) + " Thousand ";
  }
  if (hundreds > 0) {
    rupeesStr += convertBelowThousand(hundreds) + " ";
  }

  rupeesStr = rupeesStr.trim();
  if (!rupeesStr) {
    rupeesStr = "Zero";
  }

  let result = `${rupeesStr} Rupees`;

  if (paise > 0) {
    const paiseStr = convertBelowThousand(paise);
    result += ` and ${paiseStr} Paise`;
  }

  result += " Only";
  return result;
}
