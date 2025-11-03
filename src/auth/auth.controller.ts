import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService) { }


    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    register(@Body() dto: RegisterDto) {
        return this.auth.register(dto);
    }


    @Public()
    @Post('login')
    @ApiOperation({ summary: 'Login and get JWT token' })
    login(@Body() dto: LoginDto) {
        return this.auth.login(dto.username, dto.password);
    }
}