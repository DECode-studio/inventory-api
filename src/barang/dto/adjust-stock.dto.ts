import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';


export class AdjustStockDto {
    @Type(() => Number)
    @IsInt()
    delta: number; // + or -
    @IsOptional() @IsString() note?: string;
    @IsOptional() @IsDateString() txnDate?: string; // YYYY-MM-DD
}
