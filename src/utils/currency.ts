export const validCurrencies = ['USD', 'NGN'] as const

export type ValidCurrency = (typeof validCurrencies)[number]
