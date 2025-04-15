import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Get application status' })
  @ApiResponse({ status: 200, description: 'Returns the application status.' })
  @Get('/')
  getHello(): { status: string } {
    return this.appService.getStatus();
  }
}
