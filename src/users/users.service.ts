import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';


type UserResponse = {
    id: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
};


@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }


    async create(dto: CreateUserDto): Promise<UserResponse> {
        const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
        if (existing) {
            throw new ConflictException('Username already taken');
        }


        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: { username: dto.username, passwordHash },
        });
        return this.toResponse(user);
    }


    async findAll(): Promise<UserResponse[]> {
        const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
        return users.map((u) => this.toResponse(u));
    }


    async findOne(id: string): Promise<UserResponse> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return this.toResponse(user);
    }


    async update(id: string, dto: UpdateUserDto): Promise<UserResponse> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (dto.username && dto.username !== user.username) {
            const exists = await this.prisma.user.findUnique({ where: { username: dto.username } });
            if (exists) {
                throw new ConflictException('Username already taken');
            }
            user.username = dto.username;
        }


        if (dto.password) {
            user.passwordHash = await bcrypt.hash(dto.password, 12);
        }


        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                updatedAt: user.username,
                passwordHash: user.passwordHash
            },
        });
        return this.toResponse(updated);
    }


    async remove(id: string): Promise<{ id: string }> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.prisma.user.delete({ where: { id } });
        return { id };
    }


    private toResponse(user: User): UserResponse {
        return {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
