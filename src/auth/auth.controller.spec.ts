import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      refreshTokens: jest.fn(),
    } as any;

    controller = new AuthController(authService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login with LoginDto', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: '1234' };
      const result = { accessToken: 'token', refreshToken: 'refresh' };
      (authService.login as jest.Mock).mockResolvedValue(result);

      expect(await controller.login(dto)).toBe(result);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refreshTokens', () => {
    it('should call authService.refreshTokens with RefreshTokenDto', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'refresh-token' };
      const result = { accessToken: 'token', refreshToken: 'refresh' };
      (authService.refreshTokens as jest.Mock).mockResolvedValue(result);

      expect(await controller.refreshTokens(dto)).toBe(result);
      expect(authService.refreshTokens).toHaveBeenCalledWith(dto);
    });
  });
});
