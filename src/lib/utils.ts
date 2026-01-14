export function getCurrencySymbol(currency?: string) {
    if (!currency) return '$';
    switch (currency.toUpperCase()) {
        case 'HKD': return 'HK$';
        case 'CNY': return '¥';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'JPY': return '¥';
        default: return '$';
    }
}
