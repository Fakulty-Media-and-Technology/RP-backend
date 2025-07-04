export interface PaystackTransferWebhooksData {
  event: 'transfer.success' | 'transfer.failed' | 'transfer.reversed'
  data: Data
}

interface Data {
  amount: number
  currency: string
  domain: string
  failures: null
  id: number
  integration: Integration
  reason: string
  reference: string
  source: string
  source_details: null
  status: string
  titan_code: null
  transfer_code: string
  transferred_at: null
  recipient: Recipient
  session: Session
  created_at: string
  updated_at: string
}

interface Session {
  provider: null
  id: null
}

interface Recipient {
  active: boolean
  currency: string
  description: string
  domain: string
  email: null
  id: number
  integration: number
  metadata: null
  name: string
  recipient_code: string
  type: string
  is_deleted: boolean
  details: Details
  created_at: string
  updated_at: string
}

interface Details {
  account_number: string
  account_name: null
  bank_code: string
  bank_name: string
}

interface Integration {
  id: number
  is_live: boolean
  business_name: string
}
