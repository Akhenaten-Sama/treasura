import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('users') // Group the endpoints under the "users" tag in Swagger
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' }) // Describe the purpose of the endpoint
  @ApiBody({
    description: 'The data needed to create a new user',
    type: CreateUserDto,
    examples: {
      example1: {
        summary: 'Example user creation',
        value: {
          email: 'user@example.com',
          password: 'securepassword',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User successfully created.', type: User })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get(':email')
  @ApiOperation({ summary: 'Find a user by email' }) // Describe the purpose of the endpoint
  @ApiParam({
    name: 'email',
    description: 'The email of the user to find',
    type: String,
    example: 'user@example.com',
  })
  @ApiResponse({ status: 200, description: 'User found.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('email') email: string): Promise<User> {
    return this.usersService.findByEmail(email);
  }
}
