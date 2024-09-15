const nodemailer = require("nodemailer");
const path = require("path");
const ejs = require("ejs");

// const { fileURLToPath } = require("url");

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Email {
     firstName = "";
     lastName = "";
     email = "";
     sender = "";

     constructor(recipientData) {
          this.firstName = recipientData.firstName;
          this.lastName = recipientData.lastName;
          this.email = recipientData.email;
          this.sender = process.env.MAILTRAP_USER;
     }

     async createTransport() {
          const transport = nodemailer.createTransport({
               service: "gmail",
               auth: {
                    user: process.env.MAILTRAP_USER,
                    pass: process.env.MAILTRAP_PASS,
               },
          });

          return transport;
     }

     async sendMsg(template, subject, pin) {
          const templatePath = path.join(
               __dirname,
               "..",
               "views",
               `${template}.ejs`
          );

          const html = await ejs.renderFile(templatePath, {
               name: `${this.firstName}, ${this.lastName}`,
               pin: pin,
          });

          const mailOptions = {
               from: {
                    name: process.env.MAIL_SENDER,
                    address: this.sender,
               },
               to: this.email,
               subject,
               html,
               text: html,
          };

          const mail = await this.createTransport();
          await mail.sendMail(mailOptions);
     }

     sendVerifyEmail(pin) {
          this.sendMsg("verify-email", "Welcome On Board", pin);
     }

     sendResetPasswordToken(pin) {
          this.sendMsg("reset-pass", "Reset Password Token", pin);
     }

     sendAutoRenewSuccess(source) {
          this.sendMsg(
               "autorenew-success",
               "Auto Renew Subscription Success",
               source
          );
     }

     sendAutoRenewFailure(reason) {
          this.sendMsg(
               "autorenew-fail",
               "Auto Renew Subscription Failure",
               reason
          );
     }
}

module.exports = Email;
