const small = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function belowHundred(value: number): string {
  return value < 20 ? small[value] : tens[Math.floor(value / 10)] + (value % 10 ? '-' + small[value % 10] : '');
}

/** British cheque wording for a four-digit integer amount. */
export function amountToWords(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 9999) throw new RangeError('Expected an integer from 0 to 9999');
  if (value === 0) return 'Zero';
  const parts: string[] = [];
  const thousands = Math.floor(value / 1000);
  const hundreds = Math.floor(value % 1000 / 100);
  const remainder = value % 100;
  if (thousands) parts.push(small[thousands] + ' thousand');
  if (hundreds) parts.push(small[hundreds] + ' hundred');
  if (remainder) parts.push((parts.length ? 'and ' : '') + belowHundred(remainder));
  const words = parts.join(' ');
  return words[0].toUpperCase() + words.slice(1);
}

/** Only confirmed leading digits contribute; unrecognized positions remain undisplayed. */
export function recognizedAmountWords(predictions: Array<string | null>): string {
  let prefix = '';
  for (const digit of predictions) {
    if (digit === null || !/^[0-9]$/.test(digit)) break;
    prefix += digit;
  }
  if (!prefix.length) return '';
  const value = Number(prefix.padEnd(4, '0'));
  // Leading zero alone carries no amount information.
  if (value === 0 && prefix.length < 4) return '';
  // A pending units digit could change "ten" into any teen number.
  if (prefix.length === 3 && prefix[2] === '1') return amountToWords(Math.floor(value / 100) * 100);
  return amountToWords(value);
}
