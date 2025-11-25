// Currency symbols and formatting
export const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    KES: 'KSh',
    GHS: 'GH₵',
    ZAR: 'R',
    INR: '₹',
    JPY: '¥',
    CNY: '¥',
    AUD: 'A$',
    CAD: 'C$',
};

export const CURRENCY_OPTIONS = [
    { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
    { value: 'NGN', label: 'Nigerian Naira (₦)', symbol: '₦' },
    { value: 'KES', label: 'Kenyan Shilling (KSh)', symbol: 'KSh' },
    { value: 'GHS', label: 'Ghanaian Cedi (GH₵)', symbol: 'GH₵' },
    { value: 'ZAR', label: 'South African Rand (R)', symbol: 'R' },
    { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
    { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' },
    { value: 'CNY', label: 'Chinese Yuan (¥)', symbol: '¥' },
    { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
    { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
];

export const getCurrencySymbol = (currencyCode: string = 'USD'): string => {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
};

export const formatCurrency = (
    amount: number,
    currencyCode: string = 'USD',
    showSymbol: boolean = true
): string => {
    const symbol = getCurrencySymbol(currencyCode);
    const formatted = amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    return showSymbol ? `${symbol}${formatted}` : formatted;
};
