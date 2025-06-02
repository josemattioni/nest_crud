import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { HashingService } from 'src/auth/hashing/hashing.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('UserService', () => {
  let usersService: UsersService;
  let userRepository: Repository<User>;
  let hashingService: HashingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
            findOneBy: jest.fn(),
            find: jest.fn(),
            preload: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: HashingService,
          useValue: {
            hash: jest.fn(),
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    hashingService = module.get<HashingService>(HashingService);
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'jhon@email.com',
        name: 'jhon',
        password: '12345',
      };

      const passwordHash = 'PASSWORDHASH';

      const newUser = {
        id: 1,
        nome: createUserDto.name,
        email: createUserDto.email,
        passwordHash,
      };

      jest.spyOn(hashingService, 'hash').mockResolvedValue(passwordHash);

      jest.spyOn(userRepository, 'create').mockReturnValue(newUser as any);

      const result = await usersService.create(createUserDto);

      expect(hashingService.hash).toHaveBeenCalledWith(createUserDto.password);

      expect(userRepository.create).toHaveBeenCalledWith({
        name: createUserDto.name,
        passwordHash: passwordHash,
        email: createUserDto.email,
      });

      expect(userRepository.save).toHaveBeenCalledWith(newUser);

      expect(result).toEqual(newUser);
    });

    it('should throw conflictException when email already exists', async () => {
      jest.spyOn(userRepository, 'save').mockRejectedValue({
        code: '23505',
      });

      await expect(usersService.create({} as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw generic error', async () => {
      jest
        .spyOn(userRepository, 'save')
        .mockRejectedValue(new Error('generic error'));

      await expect(usersService.create({} as any)).rejects.toThrow(
        new Error('generic error'),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const userId = 1;
      const userFound = {
        id: userId,
        name: 'jhon',
        email: 'jhon@email.com',
        passwordHash: '123456',
      };

      jest
        .spyOn(userRepository, 'findOneBy')
        .mockResolvedValue(userFound as any);

      const result = await usersService.findOne(userId);

      expect(result).toEqual(userFound);
    });

    it('should return Not Found Exception if user not found', async () => {
      await expect(usersService.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const usersMock: User[] = [
        {
          id: 1,
          name: 'jhon',
          email: 'jhon@email.com',
          passwordHash: '123456',
        } as User,
      ];

      jest.spyOn(userRepository, 'find').mockResolvedValue(usersMock);

      const result = await usersService.findAll();

      expect(result).toEqual(usersMock);
      expect(userRepository.find).toHaveBeenCalledWith({
        order: {
          id: 'desc',
        },
      });
    });
  });

  describe('update', () => {
    it('should update user if authorized', async () => {
      const userId = 1;
      const updateUserDto = { name: 'Joana', password: '654321' };
      const tokenPayload = { sub: userId } as any;
      const passwordHash = 'PASSWORDHASH';
      const updatedUser = { id: userId, name: 'Joana', passwordHash };

      jest.spyOn(hashingService, 'hash').mockResolvedValueOnce(passwordHash);
      jest
        .spyOn(userRepository, 'preload')
        .mockResolvedValue(updatedUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser as any);

      const result = await usersService.update(
        userId,
        updateUserDto,
        tokenPayload,
      );

      expect(hashingService.hash).toHaveBeenCalledWith(updateUserDto.password);
      expect(userRepository.preload).toHaveBeenCalledWith({
        id: userId,
        name: updateUserDto.name,
        passwordHash,
      });
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });
  });

  it('should throw ForbiddenException if user not authorized', async () => {
    const userId = 1;
    const tokenPayload = { sub: 2 } as any;
    const updateUserDto = { name: 'Jane Doe' };
    const existingUser = { id: userId, name: 'John Doe' };

    jest
      .spyOn(userRepository, 'preload')
      .mockResolvedValue(existingUser as any);

    await expect(
      usersService.update(userId, updateUserDto, tokenPayload),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if user dosent exist', async () => {
    const userId = 1;
    const tokenPayload = { sub: userId } as any;
    const updateUserDto = { name: 'Jane Doe' };

    jest.spyOn(userRepository, 'preload').mockResolvedValue(undefined);

    await expect(
      usersService.update(userId, updateUserDto, tokenPayload),
    ).rejects.toThrow(NotFoundException);
  });

  describe('remove', () => {
    it('should remove a person if autorized', async () => {
      const userId = 1;
      const tokenPayload = { sub: userId } as any;
      const existingUser = { id: userId, nome: 'John Doe' };

      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(existingUser as any);
      jest
        .spyOn(userRepository, 'remove')
        .mockResolvedValue(existingUser as any);

      const result = await usersService.remove(userId, tokenPayload);

      expect(usersService.findOne).toHaveBeenCalledWith(userId);
      expect(userRepository.remove).toHaveBeenCalledWith(existingUser);
      expect(result).toEqual(existingUser);
    });

    it('should throw ForbiddenException if not authorized', async () => {
      const userId = 1;
      const tokenPayload = { sub: 2 } as any;
      const existingUser = { id: userId, name: 'John Doe' };

      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(existingUser as any);

      await expect(usersService.remove(userId, tokenPayload)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if not found', async () => {
      const userId = 1;
      const tokenPayload = { sub: userId } as any;

      jest
        .spyOn(usersService, 'findOne')
        .mockRejectedValue(new NotFoundException());

      await expect(usersService.remove(userId, tokenPayload)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('uploadPicture', () => {
    it('should save image and update user', async () => {
      const mockFile = {
        originalname: 'test.png',
        size: 2000,
        buffer: Buffer.from('file content'),
      } as Express.Multer.File;

      const mockUser = {
        id: 1,
        name: 'jhon',
        email: 'jhon@email.com',
      } as User;

      const tokenPayload = { sub: 1 } as any;

      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue({
        ...mockUser,
        picture: '1.png',
      });

      const filePath = path.resolve(process.cwd(), 'pictures', '1.png');

      const result = await usersService.uploadPicture(mockFile, tokenPayload);

      expect(fs.writeFile).toHaveBeenCalledWith(filePath, mockFile.buffer);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        picture: '1.png',
      });
      expect(result).toEqual({
        ...mockUser,
        picture: '1.png',
      });
    });

    it('should throw BadRequestException if the file is to small', async () => {
      const mockFile = {
        originalname: 'test.png',
        size: 500,
        buffer: Buffer.from('small content'),
      } as Express.Multer.File;

      const tokenPayload = { sub: 1 } as any;

      await expect(
        usersService.uploadPicture(mockFile, tokenPayload),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockFile = {
        originalname: 'test.png',
        size: 2000,
        buffer: Buffer.from('file content'),
      } as Express.Multer.File;

      const tokenPayload = { sub: 1 } as any;

      jest
        .spyOn(usersService, 'findOne')
        .mockRejectedValue(new NotFoundException());

      await expect(
        usersService.uploadPicture(mockFile, tokenPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
