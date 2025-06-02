import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import globalConfig from 'src/global-config/global.config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MessagesModule } from 'src/messages/messages.module';
import { UsersModule } from 'src/users/users.module';
import { GlobalConfigModule } from 'src/global-config/global-config.module';
import { AuthModule } from 'src/auth/auth.module';
import * as path from 'path';
import appConfig from 'src/app/config/app.config';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

const login = async (
  app: INestApplication,
  email: string,
  password: string,
) => {
  const response = await request(app.getHttpServer())
    .post('/auth')
    .send({ email, password });

  return response.body.accessToken;
};

const createUserAndLogin = async (app: INestApplication) => {
  const name = 'Any User';
  const email = 'anyuser@email.com';
  const password = '123456';

  await request(app.getHttpServer()).post('/users').send({
    name,
    email,
    password,
  });

  return login(app, email, password);
};

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(globalConfig),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          database: 'testing',
          password: 'admin',
          autoLoadEntities: true,
          synchronize: true,
          dropSchema: true,
        }),
        ServeStaticModule.forRoot({
          rootPath: path.resolve(__dirname, '..', '..', 'pictures'),
          serveRoot: '/pictures',
        }),
        MessagesModule,
        UsersModule,
        GlobalConfigModule,
        AuthModule,
      ],
    }).compile();

    app = module.createNestApplication();

    appConfig(app);

    await app.init();

    authToken = await createUserAndLogin(app);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a useer', async () => {
      const createUserDto = {
        email: 'jhon@email.com',
        password: '123456',
        name: 'jhon',
      };
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        email: createUserDto.email,
        passwordHash: expect.any(String),
        name: createUserDto.name,
        active: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        picture: '',
        id: expect.any(Number),
      });
    });
    it('should throw an error if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'jhon@email.com',
        name: 'jhon',
        password: '123456',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(HttpStatus.CONFLICT);

      expect(response.body.message).toBe('Email already in use');
    });

    it('should throw error if small password', async () => {
      const createUserDto: CreateUserDto = {
        email: 'jhon@email.com',
        name: 'jhon',
        password: '123',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toEqual([
        'password must be longer than or equal to 4 characters',
      ]);
      expect(response.body.message).toContain(
        'password must be longer than or equal to 4 characters',
      );
    });
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'jhon@email.com',
          name: 'jhon',
          password: '123456',
        })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            email: 'jhon@email.com',
            name: 'jhon',
          }),
        ]),
      );
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by id', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'jhon@email.com',
          name: 'jhon',
          password: '123456',
        })
        .expect(HttpStatus.CREATED);

      const userId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: userId,
          email: 'jhon@email.com',
          name: 'jhon',
        }),
      );
    });

    it('should thorw error user not found', async () => {
      await request(app.getHttpServer())
        .get('/users/999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'jhon@email.com',
          name: 'jhon',
          password: '123456',
        })
        .expect(HttpStatus.CREATED);

      const userId = createResponse.body.id;

      const authToken = await login(app, 'jhon@email.com', '123456');

      const updateResponse = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send({
          name: 'jhon Updated',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(updateResponse.body).toEqual(
        expect.objectContaining({
          id: userId,
          name: 'jhon Updated',
        }),
      );
    });

    it('should return error if user not found', async () => {
      await request(app.getHttpServer())
        .patch('/users/9999') // ID fictício
        .send({
          name: 'updated name',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'jhon@email.com',
          name: 'jhon',
          password: '123456',
        })
        .expect(HttpStatus.CREATED);

      const authToken = await login(app, 'jhon@email.com', '123456');

      const personId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/users/${personId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.email).toBe('jhon@email.com');
    });

    it('should throw error if user not found', async () => {
      await request(app.getHttpServer())
        .delete('/users/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
