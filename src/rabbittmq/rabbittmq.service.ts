// rabbitmq.service.ts

import { Injectable } from '@nestjs/common';
import { connect, Connection, Channel } from 'amqplib';

@Injectable()
export class RabbitMQService {
  private connection: Connection;
  private channel: Channel;
  private readonly queueName = 'new_activities';

  async initialize() {
    this.connection = await connect('amqp://guest:guest@localhost:5672'); // Coloque a URL de conexão correta para o seu servidor RabbitMQ
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queueName);
  }

  async sendMessage(message: string) {
    await this.channel.sendToQueue(this.queueName, Buffer.from(message));
  }

  async closeConnection() {
    await this.channel.close();
    await this.connection.close();
  }
}
