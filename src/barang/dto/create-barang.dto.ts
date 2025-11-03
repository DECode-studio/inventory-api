import { IsOptional, IsString } from 'class-validator';


export class CreateBarangDto {
    @IsString() nama: string;
    @IsOptional() @IsString() fotoPath?: string; // filled by upload
    @IsOptional() @IsString() stok?: string;
    @IsOptional() @IsString() harga?: string;
}
