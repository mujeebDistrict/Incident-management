import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

const SALT_VALUE = 10;
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, name, password } = dto;
    const user = await this.prisma.user.findUnique({ where: { email: email } });

    if (user) {
      throw new ConflictException();
    }

    const hashedPassword = await bcrypt.hash(password, SALT_VALUE);
    const createdUser = await this.prisma.user.create({
      data: {
        email: email,
        name: name,
        passwordHash: hashedPassword,
      },
    });

    const { passwordHash, ...strippedUser } = createdUser;

    return strippedUser;
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }
}
