import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { relative } from 'path';
import { BarangService } from './barang.service';
import { CreateBarangDto } from './dto/create-barang.dto';
import { UpdateBarangDto } from './dto/update-barang.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SetPriceDto } from './dto/set-price.dto';


@ApiTags('barang')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('barang')
export class BarangController {
    constructor(private readonly barangService: BarangService) { }


    @Post()
    @UseInterceptors(FileInterceptor('foto'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                nama: { type: 'string' },
                stok: { type: 'string', nullable: true },
                harga: { type: 'string', nullable: true },
                foto: { type: 'string', format: 'binary' },
            },
            required: ['nama'],
        },
    })
    create(
        @Body() dto: CreateBarangDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const payload: CreateBarangDto = {
            ...dto,
            fotoPath: file ? this.normalizeFotoPath(file.path) : undefined,
        };
        return this.barangService.create(payload);
    }


    @Get()
    findAll() {
        return this.barangService.findAll();
    }


    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.barangService.findOne(id);
    }


    @Patch(':id')
    @UseInterceptors(FileInterceptor('foto'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                nama: { type: 'string', nullable: true },
                stok: { type: 'string', nullable: true },
                harga: { type: 'string', nullable: true },
                foto: { type: 'string', format: 'binary' },
            },
        },
    })
    update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateBarangDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const payload: UpdateBarangDto = {
            ...dto,
            fotoPath: file ? this.normalizeFotoPath(file.path) : dto.fotoPath,
        };
        return this.barangService.update(id, payload);
    }


    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.barangService.remove(id);
    }


    @Post(':id/stock')
    adjustStock(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: AdjustStockDto,
    ) {
        return this.barangService.adjustStock(id, dto);
    }


    @Post(':id/price')
    setPrice(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: SetPriceDto,
    ) {
        return this.barangService.setPrice(id, dto);
    }


    @Get('report/stock')
    @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
    getStockPerDate(@Query('date') date?: string) {
        if (!date) {
            throw new BadRequestException('date query parameter is required');
        }
        return this.barangService.getStockPerDate(date);
    }


    @Get('report/price')
    @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
    getPricePerDate(@Query('date') date?: string) {
        if (!date) {
            throw new BadRequestException('date query parameter is required');
        }
        return this.barangService.getPricePerDate(date);
    }


    private normalizeFotoPath(filePath: string) {
        return relative(process.cwd(), filePath);
    }
}
