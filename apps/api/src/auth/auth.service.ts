import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await argon2.hash(password);
    const user = await this.usersService.create({ email, passwordHash, name });

    return this.signToken(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, name: user.name, settings: user.settings };
  }

  private signToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
