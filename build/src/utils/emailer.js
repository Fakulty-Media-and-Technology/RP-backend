"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const node_path_1 = __importDefault(require("node:path"));
const ejs_1 = __importDefault(require("ejs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = __importDefault(require("../env"));
class Email {
    constructor(recipientData) {
        this.firstName = recipientData.firstName;
        this.lastName = recipientData.lastName;
        this.email = recipientData.email;
        this.sender = env_1.default.MAILTRAP_USER;
    }
    async createTransport() {
        const transport = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: env_1.default.MAILTRAP_USER,
                pass: env_1.default.MAILTRAP_PASS,
            },
        });
        return transport;
    }
    async sendMsg(template, subject, pin) {
        const templatePath = node_path_1.default.join(__dirname, '..', 'views', `${template}.ejs`);
        const html = await ejs_1.default.renderFile(templatePath, {
            name: `${this.firstName}, ${this.lastName}`,
            pin: pin,
        });
        const mailOptions = {
            from: {
                name: env_1.default.MAIL_SENDER,
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
    async sendVerifyEmail(pin) {
        await this.sendMsg('verify-email', 'Welcome On Board', pin);
    }
    async sendResetPasswordToken(pin) {
        await this.sendMsg('reset-pass', 'Reset Password Token', pin);
    }
    async sendAutoRenewSuccess(source) {
        await this.sendMsg('autorenew-success', 'Auto Renew Subscription Success', source);
    }
    async sendAutoRenewFailure(reason) {
        await this.sendMsg('autorenew-fail', 'Auto Renew Subscription Failure', reason);
    }
}
exports.Email = Email;
exports.default = Email;
