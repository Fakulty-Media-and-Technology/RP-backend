import { PaymentSchema } from '../models/payments.model'
import { WalletCurrencyKey } from '../repositories/WalletRepo'
import { OperationalError } from './OperationalError'

type PaymentCurrency = PaymentSchema['currency']

export const validCurrencies = ['USD', 'NGN'] as const

export type ValidCurrency = (typeof validCurrencies)[number]

export const getWalletCurrencyKey = (currency: ValidCurrency) => {
  const walletBalanceKeysToPaymentCurrencyMap: Record<PaymentCurrency, WalletCurrencyKey> = {
    NGN: 'NGNBalance',
    USD: 'USDBalance',
  }

  const currencyKey = walletBalanceKeysToPaymentCurrencyMap[currency]

  if (currencyKey == null) {
    throw new OperationalError(`${currency} invalid wallet currency in Payments`, 400)
  }

  return currencyKey
}
