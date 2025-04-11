
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userDto: any): Promise<User> {
    const user = this.userRepository.create(userDto);
    return this.userRepository.save(user).then(savedUser => Array.isArray(savedUser) ? savedUser[0] : savedUser) as Promise<User>;
  }

  async findOneById(id: string): Promise<User> {
    return this.userRepository.findOneOrFail({ where: { id } });
  }
  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOneOrFail({ where: { email } });
  }

  // Other service methods (update, delete, etc.)
}
