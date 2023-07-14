import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  async getHello(): Promise<String> {
    return 'Hello World!';
  }
}
