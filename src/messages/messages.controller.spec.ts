import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import { MessagesController } from './messages.controller';

describe('MessagesController', () => {
  let controller: MessagesController;
  const messageServiceMock = {
    createMessage: jest.fn(),
    findAll: jest.fn(),
    getMessage: jest.fn(),
    updateMessage: jest.fn(),
    deleteMessage: jest.fn(),
  };
  beforeEach(() => {
    controller = new MessagesController(messageServiceMock as any);
  });

  describe('findAll', () => {
    it('should call messageService.findAll', async () => {
      const result = [{ id: 1, text: 'test' }];
      messageServiceMock.findAll.mockResolvedValue(result);
      expect(await controller.findAll({ limit: 10, offset: 0 })).toBe(result);
      expect(messageServiceMock.findAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('getMessage', () => {
    it('should call messageService.getMessage', async () => {
      const result = { id: 1, text: 'test' };
      messageServiceMock.getMessage.mockResolvedValue(result);
      expect(await controller.getMessage(1)).toBe(result);
      expect(messageServiceMock.getMessage).toHaveBeenCalledWith(1);
    });
  });

  describe('createMessage', () => {
    it('should call messageService.createMessage', async () => {
      const dto = { text: 'hello', toId: 2 };
      const token: TokenPayloadDto = {
        sub: 1,
        email: '',
        iat: 0,
        exp: 0,
        aud: '',
        iss: '',
      };
      const result = { id: 1, text: 'hello' };
      messageServiceMock.createMessage.mockResolvedValue(result);
      expect(await controller.createMessage(dto, token)).toBe(result);
      expect(messageServiceMock.createMessage).toHaveBeenCalledWith(dto, token);
    });
  });

  describe('updateMessage', () => {
    it('should call messageService.updateMessage', async () => {
      const dto = { text: 'updated', read: true };
      const token: TokenPayloadDto = {
        sub: 1,
        email: '',
        iat: 0,
        exp: 0,
        aud: '',
        iss: '',
      };
      const result = { id: 1, text: 'updated', read: true };
      messageServiceMock.updateMessage.mockResolvedValue(result);
      expect(await controller.updateMessage(1, dto, token)).toBe(result);
      expect(messageServiceMock.updateMessage).toHaveBeenCalledWith(
        1,
        dto,
        token,
      );
    });
  });

  describe('deleteMessage', () => {
    it('should call messageService.deleteMessage', async () => {
      const token: TokenPayloadDto = {
        sub: 1,
        email: '',
        iat: 0,
        exp: 0,
        aud: '',
        iss: '',
      };
      const result = { id: 1 };
      messageServiceMock.deleteMessage.mockResolvedValue(result);
      expect(await controller.deleteMessage(1, token)).toBe(result);
      expect(messageServiceMock.deleteMessage).toHaveBeenCalledWith(1, token);
    });
  });
});
