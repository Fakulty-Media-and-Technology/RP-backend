import path from 'node:path'
import ejs from 'ejs'
import nodemailer from 'nodemailer'

import env from '../env'

type RecipientData = {
  firstName: string
  lastName: string
  email: string
}

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

  async createTransport() {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.MAILTRAP_USER,
        pass: env.MAILTRAP_PASS,
      },
    })

    return transport
  }

  async sendMsg(template: string, subject: string, pin: string) {
    const templatePath = path.join(__dirname, '..', 'views', `${template}.ejs`)

    const html = await ejs.renderFile(templatePath, {
      name: `${this.firstName}, ${this.lastName}`,
      pin: pin,
    })

    const mailOptions = {
      from: {
        name: env.MAIL_SENDER,
        address: this.sender,
      },
      to: this.email,
      subject,
      html,
      text: html,
    }

    const mail = await this.createTransport()
    await mail.sendMail(mailOptions)
  }

  async sendVerifyEmail(pin: string) {
    await this.sendMsg('verify-email', 'Welcome On Board', pin)
  }

  async sendResetPasswordToken(pin: string) {
    await this.sendMsg('reset-pass', 'Reset Password Token', pin)
  }

  async sendAutoRenewSuccess(source: string) {
    await this.sendMsg('autorenew-success', 'Auto Renew Subscription Success', source)
  }

  async sendAutoRenewFailure(reason: string) {
    await this.sendMsg('autorenew-fail', 'Auto Renew Subscription Failure', reason)
  }
}

export default Email
