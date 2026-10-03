import type { SafeBusinessSettings, SafeOrder } from "@/types/order";

/**
 * Formats a Date ISO string to Indian Standard Time (Asia/Kolkata)
 * format: Date : DD-MM-YYYY Time : HH:MM:SS
 */
function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return "Date : -- Time : --";
    }
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(d).reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

    return `Date : ${parts.day}-${parts.month}-${parts.year} Time : ${parts.hour}:${parts.minute}:${parts.second}`;
  } catch {
    return "Date : -- Time : --";
  }
}

/**
 * Formats a 10-digit or raw phone number to `+91 XXXXXXXXXX`.
 */
function formatPhoneNumberWithPrefix(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+91")) {
    return trimmed;
  }
  const cleanDigits = trimmed.replace(/\D/g, "");
  if (cleanDigits.length === 10) {
    return `+91 ${cleanDigits}`;
  }
  if (cleanDigits.startsWith("91") && cleanDigits.length === 12) {
    return `+91 ${cleanDigits.slice(2)}`;
  }
  return `+91 ${trimmed}`;
}

/**
 * Formats currency amount without trailing decimals for whole numbers.
 */
function formatAmount(val: number): string {
  if (Number.isInteger(val)) {
    return val.toString();
  }
  return val.toFixed(2);
}

/**
 * Builds the plain-text formatted WhatsApp order notification message.
 * Adheres strictly to the locked "New Estimate Details" structure:
 * - New Estimate Details header with DD-MM-YYYY HH:MM:SS
 * - SHOP DETAILS (Name, Mobile | Reach Us, Address, Gpay)
 * - CUSTOMER DETAILS (Name, Mobile, Address, City, Pincode)
 * - PRODUCTS DETAILS (1 [Name] ~ ₹[Unit Price] x [Quantity] = ₹[Total])
 * - PAYMENT DETAILS (Sub Total, Net Total)
 * - Order Number
 *
 * NO markdown asterisks, NO emojis, NO HTML, NO discounts, NO fake URLs.
 */
export function formatWhatsAppOrderMessage(
  order: SafeOrder,
  business?: SafeBusinessSettings,
  invoiceUrl?: string
): string {
  const dateTimeLine = formatDateTime(order.createdAt);

  const shopMobileNumbers: string[] = [];
  if (business?.businessMobile && business.businessMobile.trim()) {
    shopMobileNumbers.push(formatPhoneNumberWithPrefix(business.businessMobile));
  }
  if (business?.reachUsNumber && business.reachUsNumber.trim()) {
    shopMobileNumbers.push(formatPhoneNumberWithPrefix(business.reachUsNumber));
  }
  const shopMobileLine = `Mobile : ${shopMobileNumbers.join(" | ")}`;

  const gpayNumbers = (business?.gpayUpiNumbers || [])
    .filter((n) => Boolean(n && n.trim()))
    .map(formatPhoneNumberWithPrefix);
  const shopGpayLine = `Gpay : ${gpayNumbers.join(" | ")}`;

  const subTotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);

  const lines: string[] = [
    `New Estimate Details`,
    dateTimeLine,
    ``,
    `SHOP DETAILS`,
    `Name : ${business?.businessName?.trim() || ""}`,
    shopMobileLine,
    `Address : ${business?.businessAddress?.trim() || ""}`,
    shopGpayLine,
    ``,
    `CUSTOMER DETAILS`,
    `Name : ${order.customer.name}`,
    `Mobile : ${order.customer.phone}`,
    `Address : ${order.customer.address}`,
    `City : ${order.customer.city}`,
    `Pincode : ${order.customer.pincode}`,
    ``,
    `PRODUCTS DETAILS`,
  ];

  order.items.forEach((item, index) => {
    if (item.tamilName && item.tamilName.trim()) {
      lines.push(
        `${index + 1} ${item.productName}\n  ${item.tamilName.trim()} ~ ₹${formatAmount(item.unitPrice)} x ${item.quantity} = ₹${formatAmount(item.totalPrice)}`
      );
    } else {
      lines.push(
        `${index + 1} ${item.productName} ~ ₹${formatAmount(item.unitPrice)} x ${item.quantity} = ₹${formatAmount(item.totalPrice)}`
      );
    }
  });

  lines.push(``);
  lines.push(`--------------------------`);
  lines.push(`PAYMENT DETAILS`);
  lines.push(`Sub Total : ₹${formatAmount(subTotal)}`);
  lines.push(`Net Total : ₹${formatAmount(order.totalAmount)}`);
  lines.push(`--------------------------`);
  lines.push(``);
  lines.push(`Order Number : ${order.orderNumber}`);

  if (invoiceUrl && invoiceUrl.trim()) {
    lines.push(`Invoice : ${invoiceUrl.trim()}`);
  }

  return lines.join("\n");
}

/**
 * Generates the wa.me deep link with pre-filled message for manual sending.
 * Does NOT auto-send.
 */
export function getWhatsAppShareUrl(
  whatsappNumber: string,
  order: SafeOrder,
  business?: SafeBusinessSettings,
  invoiceUrl?: string
): string {
  const cleanNumber = whatsappNumber.replace(/\D/g, "");
  const formattedNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
  const message = formatWhatsAppOrderMessage(order, business, invoiceUrl);
  return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
}
