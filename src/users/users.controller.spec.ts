import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: Partial<UsersService>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = { email: 'user@example.com', password: 'securepassword' };
      const mockUser: User = {
        id: 'user-id',
        email: 'user@example.com',
        password: 'securepassword',
        wallets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);

      const result = await usersController.create(createUserDto);
      expect(result).toEqual(mockUser);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findOne', () => {
    it('should return a user by email', async () => {
      const mockUser: User = {
        id: 'user-id',
        email: 'user@example.com',
        password: 'securepassword',
        wallets: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      const result = await usersController.findOne('user@example.com');
      expect(result).toEqual(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('user@example.com');
    });

    it('should throw a NotFoundException if the user is not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockRejectedValue(new NotFoundException());

      await expect(usersController.findOne('nonexistent@example.com')).rejects.toThrow(NotFoundException);
    });
  });
});