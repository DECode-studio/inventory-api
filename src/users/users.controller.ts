import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }


    @Get()
    findAll() {
        return this.usersService.findAll();
    }


    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.usersService.findOne(id);
    }


    @Patch(':id')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }


    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.usersService.remove(id);
    }
}
