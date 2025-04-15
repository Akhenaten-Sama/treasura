import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Trim trailing spaces from all string properties in createUserDto
    const sanitizedDto = {
      ...createUserDto,
      email: createUserDto.email?.trim(),
    };
    const user = this.userRepository.create(sanitizedDto);
    return this.userRepository.save(user);
  }

  async findOneById(id: string): Promise<User> {
    return this.userRepository.findOneOrFail({ where: { id } });
  }

  async findByEmail(email: string): Promise<User> {
    // Trim trailing spaces from the email input
    const sanitizedEmail = email.trim();
    const user = await this.userRepository.findOne({ where: { email: sanitizedEmail } });
    if (!user) {
      throw new NotFoundException(`User with email ${sanitizedEmail} not found`);
    }
    return user;
  }

  // Other service methods (update, delete, etc.)
}
