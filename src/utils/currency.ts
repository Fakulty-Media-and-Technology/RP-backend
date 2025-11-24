import { PaymentSchema } from '../models/payments.model'
import { WalletCurrencyKey } from '../repositories/WalletRepo'
import { OperationalError } from './OperationalError'

type PaymentCurrency = PaymentSchema['currency']

export const validCurrencies = ['USD', 'NGN', 'GMD'] as const

export type ValidCurrency = PaymentCurrency

export const getWalletCurrencyKey = (currency: ValidCurrency) => {
  const walletBalanceKeysToPaymentCurrencyMap: Record<PaymentCurrency, WalletCurrencyKey> = {
    NGN: 'NGNBalance',
    USD: 'USDBalance',
    GMD: 'GMDBalance',
  }

  const currencyKey = walletBalanceKeysToPaymentCurrencyMap[currency]

  if (currencyKey == null) {
    throw new OperationalError(`${currency} invalid wallet currency in Payments`, 400)
  }

  return currencyKey
}
