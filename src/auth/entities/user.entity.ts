import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';


@Entity('users')
@Unique(['username'])
export class User {
    @PrimaryGeneratedColumn('uuid') id: string;


    @Column({ length: 64 }) username: string;
    @Column({ select: false }) passwordHash: string;


    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}