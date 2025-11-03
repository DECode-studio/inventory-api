import { IsString, Length } from 'class-validator';


export class RegisterDto {
    @IsString() @Length(3, 64) username: string;
    @IsString() @Length(6, 128) password: string;
}