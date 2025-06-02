import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageService } from './messages.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import { User } from 'src/users/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';

jest.mock('fs/promises');

describe('MessageService', () => {
  let usersService: UsersService;
  let messageService: MessageService;
  let messageRepository: Repository<Message>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: getRepositoryToken(Message),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            preload: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    messageService = module.get<MessageService>(MessageService);
    usersService = module.get<UsersService>(UsersService);
    messageRepository = module.get<Repository<Message>>(
      getRepositoryToken(Message),
    );
  });

  describe('findAll', () => {
    it('should find all messages', async () => {
      const mockMessages: Message[] = [
        {
          id: 1,
          text: 'Hello',
          from: {} as any,
          to: {} as any,
          read: false,
          date: new Date(),
        },
        {
          id: 2,
          text: 'World',
          from: {} as any,
          to: {} as any,
          read: false,
          date: new Date(),
        },
      ];
      jest.spyOn(messageRepository, 'find').mockResolvedValue(mockMessages);

      const result = await messageService.findAll({ limit: 10, offset: 0 });
      expect(result).toEqual(mockMessages);
    });
  });

  describe('getMessage', () => {
    it('should return a message by id', async () => {
      const mockMessage: Message = {
        id: 1,
        text: 'test',
        from: {} as any,
        to: {} as any,
        read: false,
        date: new Date(),
      };

      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(mockMessage);

      const result = await messageService.getMessage(1);
      expect(result).toEqual(mockMessage);
    });
    it('should throw NotFoundException if message not found', async () => {
      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(null);

      await expect(messageService.getMessage(1)).rejects.toThrow(
        'message not found',
      );
    });
  });

  describe('createMessage', () => {
    it('should create a new message', async () => {
      const createMessageDto = {
        text: 'Hello',
        toId: 2,
      };
      const tokenPayload: TokenPayloadDto = {
        sub: 1,
        email: '',
        iat: 0,
        exp: 0,
        aud: '',
        iss: '',
      };

      const fromUser: User = {
        id: 1,
        name: 'Sender',
        email: '',
        passwordHash: '',
        sentmMssages: [],
        recivedMessages: [],
        active: false,
        picture: '',
      };
      const toUser: User = {
        id: 2,
        name: 'Receiver',
        email: '',
        passwordHash: '',
        sentmMssages: [],
        recivedMessages: [],
        active: false,
        picture: '',
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(fromUser);
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(toUser);

      const newMessage = {
        text: createMessageDto.text,
        from: fromUser,
        to: toUser,
        read: false,
        date: new Date(),
      };

      jest
        .spyOn(messageRepository, 'create')
        .mockReturnValue(newMessage as any);
      jest
        .spyOn(messageRepository, 'save')
        .mockResolvedValue(newMessage as any);

      const result = await messageService.createMessage(
        createMessageDto,
        tokenPayload,
      );
      expect(result).toEqual({
        ...newMessage,
        from: { id: fromUser.id, name: fromUser.name },
        to: { id: toUser.id, name: toUser.name },
      });
    });
  });

  describe('updateMessage', () => {
    it('should update message if user is the sender', async () => {
      const id = 1;
      const updateMessageDto = { text: 'Updated text', read: true };
      const tokenPayload: TokenPayloadDto = {
        sub: 1,
        email: '',
        iat: 0,
        exp: 0,
        aud: '',
        iss: '',
      };

      const mockMessage: Message = {
        id,
        text: 'Old text',
        from: { id: 1, name: 'Sender' } as any,
        to: { id: 2, name: 'Receiver' } as any,
        read: false,
        date: new Date(),
      };

      jest.spyOn(messageService, 'getMessage').mockResolvedValue(mockMessage);
      jest.spyOn(messageRepository, 'save').mockResolvedValue({
        ...mockMessage,
        ...updateMessageDto,
      });

      const result = await messageService.updateMessage(
        id,
        updateMessageDto,
        tokenPayload,
      );

      expect(messageService.getMessage).toHaveBeenCalledWith(id);
      expect(messageRepository.save).toHaveBeenCalledWith({
        ...mockMessage,
        ...updateMessageDto,
      });
      expect(result.text).toBe('Updated text');
      expect(result.read).toBe(true);
    });

    it('should throw ForbiddenException if user is not the sender', async () => {
      const id = 1;
      const updateMessageDto = { text: 'Updated text', read: true };
      const tokenPayload: TokenPayloadDto = {
        sub: 99,
        email: '',
        iat: 0,
        exp: 0,
        aud: '',
        iss: '',
      };

      const mockMessage: Message = {
        id,
        text: 'Old text',
        from: { id: 1, name: 'Sender' } as any,
        to: { id: 2, name: 'Receiver' } as any,
        read: false,
        date: new Date(),
      };

      jest.spyOn(messageService, 'getMessage').mockResolvedValue(mockMessage);

      await expect(
        messageService.updateMessage(id, updateMessageDto, tokenPayload),
      ).rejects.toThrow(ForbiddenException);
    });
  });
  describe('deleteMessage', () => {
    it('should delete message if user is the sender', async () => {
      const id = 1;
      const tokenPayload: TokenPayloadDto = {
        sub: 1,
        email: '',
        iat: 0,
        exp: 0,
        aud: '',
        iss: '',
      };

      const mockMessage: Message = {
        id,
        text: 'Old text',
        from: { id: 1, name: 'Sender' } as any,
        to: { id: 2, name: 'Receiver' } as any,
        read: false,
        date: new Date(),
      };

      jest.spyOn(messageService, 'getMessage').mockResolvedValue(mockMessage);
      jest.spyOn(messageRepository, 'remove').mockResolvedValue(mockMessage);

      const result = await messageService.deleteMessage(id, tokenPayload);

      expect(messageService.getMessage).toHaveBeenCalledWith(id);
      expect(messageRepository.remove).toHaveBeenCalledWith(mockMessage);
      expect(result).toEqual(mockMessage);
    });

    it('should throw ForbiddenException if user is not the sender', async () => {
      const id = 1;
      const tokenPayload: TokenPayloadDto = {
        sub: 99,
        email: '',
        iat: 0,
        exp: 0,
        aud: '',
        iss: '',
      };

      const mockMessage: Message = {
        id,
        text: 'Old text',
        from: { id: 1, name: 'Sender' } as any,
        to: { id: 2, name: 'Receiver' } as any,
        read: false,
        date: new Date(),
      };

      jest.spyOn(messageService, 'getMessage').mockResolvedValue(mockMessage);

      await expect(
        messageService.deleteMessage(id, tokenPayload),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
