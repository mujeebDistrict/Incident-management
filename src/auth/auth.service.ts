import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcrypt';

const SALT_VALUE = 10;
@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

    async register(dto: RegisterDto) {
        const { email, name, password } = dto;
        const user = await this.prisma.user.findUnique({where: {email: email}});

        if (user)
        {
            throw new ConflictException();
        }

        const hashedPassword = await bcrypt.hash(password, SALT_VALUE);
        const createdUser = await this.prisma.user.create({data: {
            email: email,
            name: name,
            passwordHash: hashedPassword,
        }});

        const { passwordHash, ...strippedUser } = createdUser;

        return strippedUser;

    }
};