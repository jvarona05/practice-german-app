import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(1)
  name: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: { user: { userId: string } }) {
    return this.authService.getProfile(req.user.userId);
  }
}
