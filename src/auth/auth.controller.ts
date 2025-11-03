import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiBody } from '@nestjs/swagger';
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
    @ApiCreatedResponse({
        description: 'User registered successfully',
        schema: {
            example: {
                id: '39e9d91d-7b36-4a88-9e3b-793d0f88b1ae',
                username: 'johndoe',
            },
        },
    })
    @ApiBody({
        description: 'Register payload',
        schema: {
            type: 'object',
            properties: {
                username: { type: 'string', example: 'johndoe' },
                password: { type: 'string', example: 'secret123' },
            },
            required: ['username', 'password'],
            example: {
                username: 'johndoe',
                password: 'secret123',
            },
        },
    })
    register(
        @Body() dto: RegisterDto,
    ) {
        return this.auth.register(dto);
    }


    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login and get JWT token' })
    @ApiOkResponse({
        description: 'JWT token issued',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
        },
    })
    @ApiBody({
        description: 'Login payload',
        schema: {
            type: 'object',
            properties: {
                username: { type: 'string', example: 'johndoe' },
                password: { type: 'string', example: 'secret123' },
            },
            required: ['username', 'password'],
            example: {
                username: 'johndoe',
                password: 'secret123',
            },
        },
    })
    login(
        @Body() dto: LoginDto,
    ) {
        return this.auth.login(dto.username, dto.password);
    }
}
