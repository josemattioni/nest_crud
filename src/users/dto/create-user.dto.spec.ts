import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  it('should validate dto', async () => {
    const dto = new CreateUserDto();
    dto.email = 'teste@example.com';
    dto.name = 'jhon';
    dto.password = 'password';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if invalid email', async () => {
    const dto = new CreateUserDto();
    dto.email = 'invalid';
    dto.password = 'password';
    dto.name = 'jhon';

    const errors = await validate(dto);

    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('email');
  });

  it('should fail if password too small', async () => {
    const dto = new CreateUserDto();
    dto.email = 'teste@example.com';
    dto.password = '123';
    dto.name = 'jhon';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should fail if empty name', async () => {
    const dto = new CreateUserDto();
    dto.email = 'teste@example.com';
    dto.password = 'password';
    dto.name = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail if name too long', async () => {
    const dto = new CreateUserDto();
    dto.email = 'teste@example.com';
    dto.password = 'password';
    dto.name = 'a'.repeat(101);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });
});
