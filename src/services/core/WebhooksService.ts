import { PayoutSchema } from '../../models/payouts.model'
import { FlutterwaveV3WebhookTransferEvent, FlutterwaveV3WebhookPaymentEvent } from '../../paymentIntegration/flutterwave'
import { OperationalError } from '../../utils/OperationalError'
import { PaymentService } from './PaymentService'
import { PayoutService } from './PayoutService'

type TransferEvent = 'transfer.success' | 'transfer.failed' | 'transfer.reversed'
type PayoutStatus = PayoutSchema['status']

interface TransactionSuccessfull {
  reference: string
}

interface DelegateServiceInput {
  event: 'charge.success' | TransferEvent
  reference: string | null
  data: TransactionSuccessfull | null
}

export class WebhooksService {
  protected static _transformEventToPayoutStatus = (event: TransferEvent) => {
    const eventToPayoutStatusMap: Record<TransferEvent, PayoutStatus> = {
      'transfer.failed': 'rejected',
      'transfer.reversed': 'reversed',
      'transfer.success': 'completed',
    }

    const payoutStatus = eventToPayoutStatusMap[event]

    if (payoutStatus == null) {
      throw new OperationalError(`unexpected transfer event ${event}`, 500)
    }

    return payoutStatus
  }

  static flutterEvent = (
    event: FlutterwaveV3WebhookTransferEvent | FlutterwaveV3WebhookPaymentEvent,
  ) => {
    const fLW_Event = event.event

    try {
      switch (fLW_Event) {
        case 'charge.completed':
          break

        case 'transfer.completed':
          break

        default:
          throw new Error(`Unkown Event ${fLW_Event as any}`)
      }
    } catch (e: any) {}
  }

  static delegateHandler = async ({ event, reference, data }: DelegateServiceInput) => {
    try {
      if (event === 'charge.success') {
        if (data == null) {
          throw new OperationalError('Expected data object for charge.success event', 500)
        }

        await PaymentService.handlePaystackWebhookPaymentEventByReference(data.reference)
        return
      }

      // transfers
      if (reference == null) {
        throw new OperationalError('Expected reference property for transfer events', 500)
      }

      await PayoutService.handleWebhookOperations({
        reference,
        status: this._transformEventToPayoutStatus(event),
      })
    } catch (e: any) {
      console.error(
        'Error from WebhookService.delegateHandler for incoming webhooks data',
        JSON.stringify({ event, reference, data }, null, 2),
      )

      console.error('Error details', e)
    }
  }
}
