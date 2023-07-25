// rabbitmq.service.ts

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { connect, Connection, Channel } from 'amqplib';

@Injectable()
export class RabbitMQService {
  private connection: Connection;
  private channel: Channel;

  async initialize(queueName: string = 'new_activities_created') {
    this.connection = await connect('amqp://guest:guest@localhost:5672'); // Coloque a URL de conexão correta para o seu servidor RabbitMQ
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(queueName);
  }

  async sendMessage(message: string, queueName: string) {
    try {
      await this.channel.sendToQueue(`${queueName}`, Buffer.from(message));
    } catch (error) {
      throw new HttpException(
        'Error when try send a message to RabbitMQ',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async closeConnection() {
    await this.channel.close();
    await this.connection.close();
  }
}
