import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';


const expiresInEnv = process.env.JWT_EXPIRES;
const expiresIn: string | number = expiresInEnv
    ? (Number.isFinite(Number(expiresInEnv)) ? Number(expiresInEnv) : expiresInEnv)
    : '1d';


@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: expiresIn as any },
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }
