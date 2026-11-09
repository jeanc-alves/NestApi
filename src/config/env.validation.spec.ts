import 'reflect-metadata';
import { validate, Environment } from './env.validation';

describe('Environment Validation', () => {
  it('should validate valid configuration successfully', () => {
    const config = {
      NODE_ENV: 'development',
      PORT: '3333',
      DATABASE_URL:
        'postgresql://postgres:root@localhost:5432/nest?schema=public',
      JWT_SECRET: 'this_is_a_secure_jwt_secret_key_12345',
      RABBITMQ_URL: 'amqp://guest:guest@localhost:5672',
    };

    const result = validate(config);

    expect(result.PORT).toBe(3333);
    expect(result.NODE_ENV).toBe(Environment.Development);
    expect(result.JWT_SECRET).toBe('this_is_a_secure_jwt_secret_key_12345');
  });

  it('should throw error when DATABASE_URL is missing', () => {
    const config = {
      PORT: '3333',
      JWT_SECRET: 'this_is_a_secure_jwt_secret_key_12345',
    };

    expect(() => validate(config)).toThrow(/DATABASE_URL/);
  });

  it('should throw error when JWT_SECRET is shorter than 16 characters', () => {
    const config = {
      DATABASE_URL:
        'postgresql://postgres:root@localhost:5432/nest?schema=public',
      JWT_SECRET: 'short',
    };

    expect(() => validate(config)).toThrow(/JWT_SECRET/);
  });
});
