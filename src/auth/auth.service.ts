import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';


@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) { }


    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
        if (existing) throw new ConflictException('Username already taken');


        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                passwordHash,
            },
            select: {
                id: true,
                username: true,
            },
        });
        return user;
    }


    private async validateUser(username: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: { id: true, username: true, passwordHash: true },
        });
        if (!user) throw new UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) throw new UnauthorizedException('Invalid credentials');
        return user;
    }


    async login(username: string, password: string) {
        const user = await this.validateUser(username, password);
        const token = await this.jwt.signAsync({ sub: user.id, username: user.username });
        return { access_token: token };
    }
}
