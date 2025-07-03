import env from '../env'
import { validCurrencies, ValidCurrency } from './currency'
import { OperationalError } from './OperationalError'

interface CalculateEventChargesParams {
  start: string
  expiry: string
  currency: ValidCurrency
}

export class CalcUtils {
  static liveCharges = ({ start, expiry, currency }: CalculateEventChargesParams) => {
    const startDate = new Date(start)
    const expiryDate = new Date(expiry)

    if (!(startDate instanceof Date)) {
      throw new OperationalError('invalid start date string to calculate live charges', 400)
    }

    if (!(expiryDate instanceof Date)) {
      throw new OperationalError('invalid expiry date string to calculate live charges', 400)
    }

    const hoursDifference = (expiryDate.getTime() - startDate.getTime()) / (60 * 60000)
    const charge = hoursDifference * this.getHourlyCharge(currency)
    return { charge, hoursDifference }
  }

  static getHourlyCharge = (currency: ValidCurrency) => {
    if (!validCurrencies.includes(currency)) {
      throw new OperationalError(`Supported currencies are ${validCurrencies.join(' || ')}`, 400)
    }

    return currency === 'NGN' ? env.EVENT_HOURLY_CHARGES_NGN : env.EVENT_HOURLY_CHARGES_USD
  }

  static liveExtentionFromChargeAndCurrency = (charge: number, currency: ValidCurrency) => {
    return charge / this.getHourlyCharge(currency)
  }
}


