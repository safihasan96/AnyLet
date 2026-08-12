// Merchant number is hardcoded and immutable — the only way to change it is a
// new code commit (never via database, API, or any runtime mechanism).
export const MERCHANT_NUMBER = '01580632832';

export const PAYMENT_METHODS = [
    { id: 'bkash',  name: 'bKash',  color: '#E2136E', bgLight: 'bg-[#E2136E]/10', textColor: 'text-[#E2136E]', borderColor: 'border-[#E2136E]/30', logo: '🅱' },
    { id: 'nagad',  name: 'Nagad',  color: '#F6921E', bgLight: 'bg-[#F6921E]/10', textColor: 'text-[#F6921E]', borderColor: 'border-[#F6921E]/30', logo: '🇳' },
    { id: 'rocket', name: 'Rocket', color: '#8C3494', bgLight: 'bg-[#8C3494]/10', textColor: 'text-[#8C3494]', borderColor: 'border-[#8C3494]/30', logo: '🚀' },
];
