import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';


@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }


    @Post()
    @ApiOperation({ summary: 'Create a new user (admin only)' })
    @ApiCreatedResponse({
        description: 'User created',
        schema: {
            example: {
                id: 'd5c5c2ba-d3be-4fa8-b42b-4d2e5c4100f1',
                username: 'staff',
                createdAt: '2025-01-01T02:03:04.000Z',
                updatedAt: '2025-01-01T02:03:04.000Z',
            },
        },
    })
    @ApiBody({
        description: 'New user payload',
        schema: {
            type: 'object',
            properties: {
                username: { type: 'string', example: 'staff' },
                password: { type: 'string', example: 'staff123' },
            },
            required: ['username', 'password'],
            example: {
                username: 'staff',
                password: 'staff123',
            },
        },
    })
    create(
        @Body() dto: CreateUserDto,
    ) {
        return this.usersService.create(dto);
    }


    @Get()
    @ApiOperation({ summary: 'List all users' })
    @ApiOkResponse({
        description: 'Array of users',
        schema: {
            example: [
                {
                    id: 'd5c5c2ba-d3be-4fa8-b42b-4d2e5c4100f1',
                    username: 'staff',
                    createdAt: '2025-01-01T02:03:04.000Z',
                    updatedAt: '2025-01-01T02:03:04.000Z',
                },
            ],
        },
    })
    findAll() {
        return this.usersService.findAll();
    }


    @Get(':id')
    @ApiOperation({ summary: 'Get user detail' })
    @ApiOkResponse({
        description: 'User detail',
        schema: {
            example: {
                id: 'd5c5c2ba-d3be-4fa8-b42b-4d2e5c4100f1',
                username: 'staff',
                createdAt: '2025-01-01T02:03:04.000Z',
                updatedAt: '2025-01-01T02:03:04.000Z',
            },
        },
    })
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
    ) {
        return this.usersService.findOne(id);
    }


    @Patch(':id')
    @ApiOperation({ summary: 'Update user (username/password)' })
    @ApiOkResponse({
        description: 'Updated user',
        schema: {
            example: {
                id: 'd5c5c2ba-d3be-4fa8-b42b-4d2e5c4100f1',
                username: 'staff',
                createdAt: '2025-01-01T02:03:04.000Z',
                updatedAt: '2025-01-02T10:11:12.000Z',
            },
        },
    })
    @ApiBody({
        description: 'Fields to update',
        schema: {
            type: 'object',
            properties: {
                username: { type: 'string', example: 'staff-updated' },
                password: { type: 'string', example: 'newSecret123' },
            },
            example: {
                password: 'newSecret123',
            },
        },
    })
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateUserDto,
    ) {
        return this.usersService.update(id, dto);
    }


    @Delete(':id')
    @ApiOperation({ summary: 'Delete user' })
    @ApiOkResponse({
        description: 'Deletion confirmation',
        schema: {
            example: {
                id: 'd5c5c2ba-d3be-4fa8-b42b-4d2e5c4100f1',
            },
        },
    })
    remove(
        @Param('id', new ParseUUIDPipe()) id: string,
    ) {
        return this.usersService.remove(id);
    }
}
