import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthTokenGuard } from './auth-token.guard';

describe('AuthTokenGuard', () => {
  let guard: AuthTokenGuard;
  let userRepositoryMock: any;
  let jwtServiceMock: any;
  let jwtConfigurationMock: any;

  beforeEach(() => {
    userRepositoryMock = { findOneBy: jest.fn() };
    jwtServiceMock = { verifyAsync: jest.fn() };
    jwtConfigurationMock = {
      jwtTtl: 3600,
      jwtRefresh: 7200,
      audience: 'test-aud',
      issuer: 'test-iss',
      secret: 'test-secret',
    };

    guard = new AuthTokenGuard(
      userRepositoryMock,
      jwtServiceMock,
      jwtConfigurationMock,
    );
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if token is valid and user exists', async () => {
    const mockPayload = { sub: 1 };
    const mockUser = { id: 1, active: true };
    jwtServiceMock.verifyAsync.mockResolvedValue(mockPayload);
    userRepositoryMock.findOneBy.mockResolvedValue(mockUser);

    const mockRequest: any = {
      headers: { authorization: 'Bearer validtoken' },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockContext)).resolves.toBe(true);
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('validtoken', jwtConfigurationMock);
    expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: 1, active: true });
  });

  it('should throw if no token is present', async () => {
    const mockRequest: any = { headers: {} };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw if user is not found', async () => {
    const mockPayload = { sub: 1 };
    jwtServiceMock.verifyAsync.mockResolvedValue(mockPayload);
    userRepositoryMock.findOneBy.mockResolvedValue(null);

    const mockRequest: any = {
      headers: { authorization: 'Bearer validtoken' },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw if jwtService.verifyAsync throws', async () => {
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid token'));

    const mockRequest: any = {
      headers: { authorization: 'Bearer invalidtoken' },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });
});