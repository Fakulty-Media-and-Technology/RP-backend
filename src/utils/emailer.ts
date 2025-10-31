import path from 'node:path'
import ejs from 'ejs'
import nodemailer from 'nodemailer'
import env from '../env'
import { capitalize } from './strGen'
import { UserDocument } from '../models/users.model'

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

// TODO: REORGANIZE
export class Email {
  private firstName: string
  private lastName: string
  private email: string

  constructor(recipientData: RecipientData) {
    this.firstName = capitalize(recipientData.firstName)
    this.lastName = capitalize(recipientData.lastName)
    this.email = recipientData.email.toLowerCase()
  }

  protected async makeHtml({ template, pin }: MakeHtmlInput) {
    const templatePath = path.resolve('src', 'views', `${template}.ejs`)

    const html = await ejs.renderFile(templatePath, {
      name: `${this.firstName}, ${this.lastName}`,
      pin: pin,
      footerYear: new Date().getFullYear(),
    })

    return html
  }

  async sendMsg({ subject, ...params }: SendMessageInput) {
    const html = await this.makeHtml(params)

    const transport = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_PORT === 465,
      auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASSWORD,
      },
    })

    await transport.sendMail({
      from: {
        name: env.MAIL_SENDER,
        address: env.MAIL_USER,
      },
      to: this.email,
      subject,
      html,
      text: html,
    })
  }

  async sendVerifyEmail(pin: string) {
    await this.sendMsg({
      template: 'verify-email',
      subject: 'Welcome On Board',
      pin,
    })
  }

  async sendResetPasswordToken(pin: string) {
    await this.sendMsg({
      template: 'reset-pass',
      subject: 'Reset Password Token',
      pin,
    })
  }

  async sendResetPin(pin: string) {
    await this.sendMsg({
      template: 'reset-pin',
      subject: 'Reset Pin',
      pin,
    })
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

  static makeRecepiant = (userDocument: UserDocument) => {
    const data: RecipientData = {
      firstName: capitalize(userDocument.first_name),
      lastName: capitalize(userDocument.last_name),
      email: userDocument.email.toLowerCase(),
    }

    return data
  }
}

export default Email
