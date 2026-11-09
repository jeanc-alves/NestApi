import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMail', () => {
    it('should invoke transporter sendMail', async () => {
      const mockSend = jest.fn().mockResolvedValue({ messageId: '123' });
      (service as any).transporter = { sendMail: mockSend };

      const result = await service.sendMail({
        to: 'student@example.com',
        subject: 'Welcome',
        text: 'Hello student',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'student@example.com',
          subject: 'Welcome',
        }),
      );
      expect(result).toEqual({ messageId: '123' });
    });
  });
});
