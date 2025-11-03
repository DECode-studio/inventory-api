import { IsOptional, IsString, MinLength } from 'class-validator';


export class UpdateUserDto {
    @IsOptional()
    @IsString()
    username?: string;


    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;
}
