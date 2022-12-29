import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interfaces';
import * as FormData from 'form-data';
import got from 'got';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  //Sends an email through Mailgun API using cURL
  //!Needs: API KEY, DOMAIN, FROM DOMAIN EMAIL, TEMPLATE (ON MAILGUN)
  //!Currently only sending to a single email due to how Mailgun free tier works
  private async sendEmail(
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ) {
    const form = new FormData();
    form.append(
      'from',
      `Ivan from SnapSnacks! <mailgun@${this.options.domain}>`,
    );
    form.append('to', `${this.options.fromEmail}`);
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach((element) =>
      form.append(`v:${element.key}`, element.value),
    );
    try {
      const response = await got(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: form,
        },
      );
      console.log(response.body);
    } catch (e) {
      console.log(e);
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify your Email', 'confirmation', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
