import { IsDateString, IsString } from 'class-validator';


export class SetPriceDto {
    @IsString() harga: string; // decimal in string
    @IsDateString() tanggalBerlaku: string; // YYYY-MM-DD
}
