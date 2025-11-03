import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';


@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private users: Repository<User>,
        private jwt: JwtService,
    ) { }


    async register(dto: RegisterDto) {
        const exists = await this.users.count({ where: { username: dto.username } });
        if (exists) throw new ConflictException('Username already taken');


        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = this.users.create({ username: dto.username, passwordHash });
        await this.users.save(user);
        return { id: user.id, username: user.username };
    }


    async validateUser(username: string, password: string) {
        const user = await this.users.findOne({ where: { username }, select: ['id', 'username', 'passwordHash'] });
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