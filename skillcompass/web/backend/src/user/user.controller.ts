import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; username?: string }) {
    return this.userService.register(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.userService.login(body);
  }

  @Get('me')
  async me(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token không hợp lệ.');
    }
    const token = authHeader.substring(7);
    const decoded = this.userService.verifyJwt(token);
    if (!decoded) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');
    }
    return { user: decoded };
  }
}
