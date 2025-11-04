import axios, { AxiosResponse } from 'axios'
import { OperationalError } from '../utils/OperationalError'
import env from '../env'
import { ErrorUtils } from '../utils/ErrorUtils'

const narration = 'Reeplay Transfer'

export class Flutterwave {
  protected static _v3AxiosInstance = axios.create({
    baseURL: 'https://api.flutterwave.com/v3',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      Authorization: 'Bearer ' + env.FLUTTERWAVE_SECRET_KEY,
    },
  })

  protected static _getV3ResponseData = async <T>(response: Promise<AxiosResponse>) => {
    try {
      const awaitTedResponse = await response
      const serverResponse = awaitTedResponse.data as FlutterwaveV3ApiResponse<T>

      if (serverResponse.status !== 'success') {
        throw new OperationalError(serverResponse.message, awaitTedResponse.status)
      }

      return serverResponse.data
    } catch (e) {
      ErrorUtils.transformAxiosResponseError(e)
    }
  }

  static initializePayment = async (params: {
    transactionReference: string
    amount: number
    currency: string
    email: string
    fullname: string
  }) => {
    const payload = {
      payment_type: 'card',
      meta: {},
      tx_ref: params.transactionReference,
      amount: params.amount,
      currency: params.currency,
      redirect_url: `https://ee1e-102-88-35-157.ngrok-free.app`,

      customer: {
        email: params.email,
        name: params.fullname,
      },

      customizations: {
        title: 'Reeplay',
        logo: 'https://fastly.picsum.photos/id/143/536/354.jpg?hmac=4e82-520BioqZ8ztlrq1E7sOEDdhAfq7R37hykBM7EE',
      },
    }

    const data = await this._getV3ResponseData<InitilizePaymentResponse>(
      this._v3AxiosInstance.post('https://api.flutterwave.com/v3/payments', payload),
    )

    if (data == null) {
      throw new OperationalError('Could not Initialize payment', 500)
    }

    const response = {
      reference: payload.tx_ref,
      redirectUrl: data.link,
    }

    return response
  }

  static verifyPaymentByReference = async (reference: string) => {
    const data = await this._getV3ResponseData<VerifyPaymentResponseData>(
      this._v3AxiosInstance.get(`/transactions/verify_by_reference?tx_ref=${reference}`),
    )

    return data
  }

  static listBanks = async (country: string) => {
    const data = await this._getV3ResponseData<ListBank[]>(
      this._v3AxiosInstance.get(`/banks/${country}`),
    )

    return data
  }

  static getTransferById = async (id: string) => {
    const data = await this._getV3ResponseData<GetTransferByIdResponse>(
      this._v3AxiosInstance.get(`/transfers/${id}`),
    )

    return data
  }

  static initiateUSDBankTransfer = async ({
    amount,
    beneficiaryName,
    accountNumber,
    routingNumber,
    swiftCode,
    bankName,
    beneficiaryAddress,
    beneficiaryEmailAddress,
    accountType,
  }: InitiateUSDankTransferParams) => {
    const payload: USDBankTransferPayload = {
      currency: 'USD',
      narration,
      amount,
      beneficiary_name: beneficiaryName,
      meta: [
        {
          account_number: accountNumber,
          routing_number: routingNumber,
          swift_code: swiftCode,
          bank_name: bankName,
          beneficiary_address: beneficiaryAddress,
          beneficiary_name: beneficiaryName,
          beneficiary_country: 'US',
          email: beneficiaryEmailAddress,
          account_type: accountType,
        },
      ],
    }

    const data = await this._getV3ResponseData<InititateBankTransferResponse>(
      this._v3AxiosInstance.post('/transfers', payload),
    )
    return data
  }

  static initiateNGNbankTransfer = async ({
    bankCode,
    accountNumber,
    amount,
    reference,
    fullname,
    email,
  }: InitiateNGNBankTransferParams) => {
    const payload: NGNBankTransferPayload = {
      account_bank: bankCode,
      account_number: accountNumber,
      amount,
      narration,
      currency: 'NGN',
      reference,
      email,
      fullname,
    }

    const data = await this._getV3ResponseData<InititateBankTransferResponse>(
      this._v3AxiosInstance.post('/transfers', payload),
    )

    return data
  }
}

interface InitilizePaymentResponse {
  link: string
}

interface InitiateNGNBankTransferParams {
  bankCode: string
  accountNumber: string
  amount: number
  reference: string
  email: string
  fullname: string
}

interface InitiateUSDankTransferParams {
  amount: number
  beneficiaryName: string
  accountNumber: string
  routingNumber: string
  swiftCode: string
  bankName: string
  beneficiaryAddress: string
  beneficiaryEmailAddress: string
  accountType: USDBankTransferPayloadMeta['account_type']
}

interface FlutterwaveV3ApiResponse<T> {
  status: string
  message: string
  data: T
}

interface VerifyPaymentResponseData {
  id: number
  tx_ref: string
  flw_ref: string
  device_fingerprint: string
  amount: number
  currency: string
  charged_amount: number
  app_fee: number
  merchant_fee: number
  processor_response: string
  auth_model: string
  ip: string
  narration: string
  status: 'successful'
  payment_type: 'card'
  created_at: string
  account_id: number
  meta: Meta
  amount_settled: number
  customer: Customer
  card: PaymentResponseCard
}

interface PaymentResponseCard {
  first_6digits: string
  last_4digits: string
  issuer: string
  country: string
  type: string
  token: string
  expiry: string // "09/32"
}

interface Customer {
  id: number
  name: string
  phone_number: string
  email: string
  created_at: string
}

interface Meta {
  operation: string
  entityId: string
  customerId: string
  quantity?: number
}

interface ListBank {
  id: number
  code: string
  name: string
}

interface USDBankTransferPayload {
  amount: number
  narration: string
  currency: string
  beneficiary_name: string
  meta: USDBankTransferPayloadMeta[]
}

interface USDBankTransferPayloadMeta {
  account_number: string
  routing_number: string
  swift_code: string
  bank_name: string
  beneficiary_name: string
  beneficiary_address: string
  beneficiary_country: string
  email: string
  account_type: 'checking' | 'depository'
}

interface NGNBankTransferPayload extends Pick<InitiateNGNBankTransferParams, 'fullname' | 'email'> {
  // Required
  account_bank: string
  account_number: string
  amount: number
  currency: string

  // Optional
  narration: string
  reference: string
}

interface GetTransferByIdResponse {
  id: number
  account_number: string
  bank_code: string
  full_name: string
  created_at: string
  currency: string
  debit_currency: string
  amount: number
  fee: number
  status: 'SUCCESSFUL'
  reference: string
  meta: null
  narration: string
  approver: null
  complete_message: string
  requires_approval: number
  is_approved: number
  bank_name: string
}

interface InititateBankTransferResponse {
  id: number
  account_number: string
  bank_code: string
  full_name: string
  created_at: string
  currency: string
  debit_currency: string
  amount: number
  fee: number
  status: string
  reference: string
  meta: null
  narration: string
  complete_message: string
  requires_approval: number
  is_approved: number
  bank_name: string
}

export interface FlutterwaveV3WebhookTransferEvent {
  event: 'transfer.completed'
  'event.type': 'Transfer'
  data: FlutterwaveV3WebhookTransferEventData
}

interface FlutterwaveV3WebhookTransferEventData {
  id: number
  account_number: string
  bank_name: string
  bank_code: string
  fullname: string
  created_at: string
  currency: string
  debit_currency: string
  amount: number
  fee: number
  status: 'SUCCESSFUL' | 'FAILED'

  /**
   * payoutID
   */
  reference: string

  meta: null
  narration: string
  approver: null
  complete_message: string
  requires_approval: number
  is_approved: number
}

export interface FlutterwaveV3WebhookPaymentEvent {
  event: 'charge.completed'
  data: FlutterwaveWebhookPaymentData
}

interface FlutterwaveWebhookPaymentData {
  id: number

  /**
   * paymentID
   */
  tx_ref: string

  flw_ref: string
  device_fingerprint: string
  amount: number
  currency: string
  charged_amount: number
  app_fee: number
  merchant_fee: number
  processor_response: string
  auth_model: string
  ip: string
  narration: string
  status: 'successful' | 'failed'
  payment_type: string
  created_at: string
  account_id: number
  customer: FlutterwaveV3WebhookPaymentEventCustomer
  card: FlutterwaveV3WebhookPaymentEventCard
}

interface FlutterwaveV3WebhookPaymentEventCard {
  first_6digits: string
  last_4digits: string
  issuer: string
  country: string
  type: string
  expiry: string
}

interface FlutterwaveV3WebhookPaymentEventCustomer {
  id: number
  name: string
  phone_number: null
  email: string
  created_at: string
}
