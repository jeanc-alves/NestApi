import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'jon38@ethereal.email',
        pass: 'hMyjGYUjh71M8yttZ1',
      },
    });
  }

  async sendMail(options: {
    from?: string;
    to?: string | Array<string>;
    cc?: string | Array<string>;
    bcc?: string | Array<string>;
    subject?: string;
    text?: string;
    html?: string;
  }) {
    try {
      return this.transporter.sendMail(options);
    } catch (error) {
      throw new HttpException('Erro to send email', HttpStatus.BAD_REQUEST);
    }
  }
}
