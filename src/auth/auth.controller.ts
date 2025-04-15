import { Controller, Post, Body } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiExcludeEndpoint() // Exclude this route from Swagger
  async login(@Body() body: { email: string; password: string }) {
    // Route disabled
    return { message: 'This route is disabled' };
  }
}
