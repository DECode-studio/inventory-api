import { IsOptional, IsString } from 'class-validator';


export class UpdateBarangDto {
    @IsOptional() @IsString() nama?: string;
    @IsOptional() @IsString() fotoPath?: string;
    @IsOptional() @IsString() stok?: string;
    @IsOptional() @IsString() harga?: string;
}
