import { PayoutSchema } from '../../models/payouts.model'
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

  static delegateHandler = async ({ event, reference, data }: DelegateServiceInput) => {
    console.dir(
      { activity: 'WebhookService.delegateHandlercalled', payload: { event, reference, data } },
      { depth: null },
    )

    try {
      if (event === 'charge.success') {
        console.log('Charge Success event')

        if (data == null) {
          throw new OperationalError('Expected data object for charge.success event', 500)
        }

        await PaymentService.handleWebookEventByReference(data.reference)
        return
      }

      console.log('Other events')

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
