import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from './hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import jwtConfig from './config/jwt.config';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let hashingService: jest.Mocked<HashingService>;
  let jwtService: jest.Mocked<JwtService>;
  const jwtConfiguration = {
    jwtTtl: 3600,
    jwtRefresh: 7200,
    audience: 'test-aud',
    issuer: 'test-iss',
    secret: 'test-secret',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: HashingService,
          useValue: {
            compare: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: jwtConfig.KEY,
          useValue: jwtConfiguration,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    hashingService = module.get(HashingService);
    jwtService = module.get(JwtService);
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@test.com', password: '1234' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userRepository.findOneBy.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        passwordHash: 'hash',
        active: true,
      } as User);
      hashingService.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens if credentials are valid', async () => {
      userRepository.findOneBy.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        passwordHash: 'hash',
        active: true,
      } as User);
      hashingService.compare.mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login({
        email: 'test@test.com',
        password: '1234',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if jwtService.verifyAsync fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

      await expect(
        service.refreshTokens({ refreshToken: 'bad-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.refreshTokens({ refreshToken: 'token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens if refresh token and user are valid', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1 });
      userRepository.findOneBy.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        passwordHash: 'hash',
        active: true,
      } as User);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.refreshTokens({ refreshToken: 'token' });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('validatePassword', () => {
    it('should call hashingService.compare', async () => {
      const user = { passwordHash: 'hash' } as User;
      hashingService.compare.mockResolvedValue(true);

      const result = await (service as any).validatePassword(user, {
        password: '1234',
      });

      expect(hashingService.compare).toHaveBeenCalledWith('1234', 'hash');
      expect(result).toBe(true);
    });
  });

  describe('signJwtAsync', () => {
    it('should call jwtService.signAsync with correct params', async () => {
      jwtService.signAsync.mockResolvedValue('signed-token');
      const result = await (service as any).signJwtAsync(1, 3600, {
        email: 'test@test.com',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 1, email: 'test@test.com' },
        {
          audience: jwtConfiguration.audience,
          issuer: jwtConfiguration.issuer,
          secret: jwtConfiguration.secret,
          expiresIn: 3600,
        },
      );
      expect(result).toBe('signed-token');
    });
  });
});
