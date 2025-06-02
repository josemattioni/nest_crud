import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  const usersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    uploadPicture: jest.fn(),
  };

  beforeEach(() => {
    controller = new UsersController(usersServiceMock as any);
  });

  it('create - should use UserService as correct argument', async () => {
    const argument = { key: 'value' };
    const expected = { anyKey: 'anyValue' };

    jest.spyOn(usersServiceMock, 'create').mockResolvedValue(expected);

    const result = await controller.create(argument as any);

    expect(usersServiceMock.create).toHaveBeenCalledWith(argument);
    expect(result).toEqual(expected);
  });

  it('findAll - should use usersService', async () => {
    const expected = { anyKey: 'anyValue' };

    jest.spyOn(usersServiceMock, 'findAll').mockResolvedValue(expected);

    const result = await controller.findAll();

    expect(usersServiceMock.create).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('findOne - should use UserService with correct argument', async () => {
    const argument = '1';
    const expected = { anyKey: 'anyValue' };

    jest.spyOn(usersServiceMock, 'findOne').mockResolvedValue(expected);

    const result = await controller.findOne(argument as any);

    expect(usersServiceMock.findOne).toHaveBeenCalledWith(+argument);
    expect(result).toEqual(expected);
  });

  it('update - should use UserService with correct argument', async () => {
    const argument1 = '1';
    const argument2 = { key: 'value' };
    const argument3 = { key: 'value' };
    const expected = { anyKey: 'anyValue' };

    jest.spyOn(usersServiceMock, 'update').mockResolvedValue(expected);

    const result = await controller.update(
      argument1,
      argument2 as any,
      argument3 as any,
    );

    expect(usersServiceMock.update).toHaveBeenCalledWith(
      +argument1,
      argument2,
      argument3,
    );
    expect(result).toEqual(expected);
  });

  it('remove - should use UserService with correct argument', async () => {
    const argument1 = 1;
    const argument2 = { aKey: 'aValue' };
    const expected = { anyKey: 'anyValue' };

    jest.spyOn(usersServiceMock, 'remove').mockResolvedValue(expected);

    const result = await controller.remove(argument1 as any, argument2 as any);

    expect(usersServiceMock.remove).toHaveBeenCalledWith(
      +argument1,
      argument2,
    );
    expect(result).toEqual(expected);
  });

  it('uploadPicture - should use UserService with correct argument', async () => {
    const argument1 = { aKey: 'aValue' };
    const argument2 = { bKey: 'bValue' };
    const expected = { anyKey: 'anyValue' };

    jest.spyOn(usersServiceMock, 'uploadPicture').mockResolvedValue(expected);

    const result = await controller.uploadPicture(
      argument1 as any,
      argument2 as any,
    );

    expect(usersServiceMock.uploadPicture).toHaveBeenCalledWith(
      argument1,
      argument2,
    );
    expect(result).toEqual(expected);
  });
});
