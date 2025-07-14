import path from 'node:path'
import ejs from 'ejs'
import nodemailer from 'nodemailer'
import env from '../env'

interface RecipientData {
  firstName: string
  lastName: string
  email: string
}

interface SendMessageInput {
  template: string
  subject: string
  pin: string
}

interface MakeHtmlInput extends Omit<SendMessageInput, 'subject'> {}

export class Email {
  private firstName: string
  private lastName: string
  private email: string
  private sender: string

  constructor(recipientData: RecipientData) {
    this.firstName = recipientData.firstName
    this.lastName = recipientData.lastName
    this.email = recipientData.email
    this.sender = env.MAILTRAP_USER
  }

  protected createTransport() {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.MAILTRAP_USER,
        pass: env.MAILTRAP_PASS,
      },
    })

    return transport
  }

  protected async makeHtml({ template, pin }: MakeHtmlInput) {
    const templatePath = path.resolve('src', 'views', `${template}.ejs`)

    const html = await ejs.renderFile(templatePath, {
      name: `${this.firstName}, ${this.lastName}`,
      pin: pin,
    })

    return html
  }

  async sendMsg({ subject, ...params }: SendMessageInput) {
    const html = await this.makeHtml(params)

    await this.createTransport().sendMail({
      from: {
        name: env.MAIL_SENDER,
        address: this.sender,
      },
      to: this.email,
      subject,
      html,
      text: html,
    })
  }

  async sendVerifyEmail(pin: string) {
    await this.sendMsg({ template: 'verify-email', subject: 'Welcome On Board', pin })
  }

  async sendResetPasswordToken(pin: string) {
    await this.sendMsg({ template: 'reset-pass', subject: 'Reset Password Token', pin })
  }

  async sendAutoRenewSuccess(source: string) {
    await this.sendMsg({
      template: 'autorenew-success',
      subject: 'Auto Renew Subscription Success',
      pin: source,
    })
  }

  async sendAutoRenewFailure(reason: string) {
    await this.sendMsg({
      template: 'autorenew-fail',
      subject: 'Auto Renew Subscription Failure',
      pin: reason,
    })
  }
}

export default Email
