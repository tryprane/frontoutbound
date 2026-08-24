export type MailAccountOption = {
  id: string
  email: string
  displayName: string | null
}

export type ResponseListItem = {
  id: string
  mailboxThreadId: string
  counterpartEmail: string | null
  subject: string | null
  snippet: string | null
  mailAccount: MailAccountOption
  campaign: { id: string; name: string } | null
  status: string
  classification: 'interested' | 'not_interested' | 'automatic' | 'needs_review'
  firstRespondedAt: string
  latestRespondedAt: string
  lastOutboundReplyAt: string | null
  unread: boolean
  source: 'Campaign' | 'API' | null
}

export type ResponseThreadMessage = {
  id: string
  sourceType: 'mailbox' | 'sent_mail'
  direction: 'inbound' | 'outbound'
  fromEmail: string | null
  toEmail: string | null
  subject: string | null
  bodyHtml: string | null
  bodyText: string | null
  sentAt: string | null
  receivedAt: string | null
  createdAt: string
  mailAccount?: MailAccountOption
  campaign?: { id: string; name: string } | null
  sequenceStepNumber?: number | null
}

export type ResponseThreadDetail = {
  response: {
    id: string
    subject: string | null
    counterpartEmail: string | null
    status: string
    classification: 'interested' | 'not_interested' | 'automatic' | 'needs_review'
  }
  thread: ResponseThreadMessage[]
}
