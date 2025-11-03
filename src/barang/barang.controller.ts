import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
    @ApiOperation({ summary: 'Create new barang with optional photo upload' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                nama: { type: 'string', example: 'Barang Test' },
                stok: { type: 'string', nullable: true, example: '10' },
                harga: { type: 'string', nullable: true, example: '15000' },
                foto: { type: 'string', format: 'binary' },
            },
            required: ['nama'],
            example: {
                nama: 'Barang Test',
                stok: '10',
                harga: '15000',
            },
        },
    })
    @ApiCreatedResponse({
        description: 'Barang created',
        schema: {
            example: {
                id: '7c68e75a-437e-4bd5-a3a1-376094ce6d0a',
                nama: 'Barang Test',
                kode: 'BRG/25/01/00001',
                stok: '10',
                harga: '15000',
                fotoPath: 'uploads/1700000000000-123456789.png',
                createdAt: '2025-01-01T02:03:04.000Z',
                updatedAt: '2025-01-01T02:03:04.000Z',
            },
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
    @ApiOperation({ summary: 'List all barang' })
    @ApiOkResponse({
        description: 'Array of barang',
        schema: {
            example: [
                {
                    id: '7c68e75a-437e-4bd5-a3a1-376094ce6d0a',
                    nama: 'Barang Test',
                    kode: 'BRG/25/01/00001',
                    stok: '10',
                    harga: '15000',
                    fotoPath: 'uploads/1700000000000-123456789.png',
                    createdAt: '2025-01-01T02:03:04.000Z',
                    updatedAt: '2025-01-01T02:03:04.000Z',
                },
            ],
        },
    })
    findAll() {
        return this.barangService.findAll();
    }


    @Get(':id')
    @ApiOperation({ summary: 'Get barang detail' })
    @ApiOkResponse({
        description: 'Barang detail',
        schema: {
            example: {
                id: '7c68e75a-437e-4bd5-a3a1-376094ce6d0a',
                nama: 'Barang Test',
                kode: 'BRG/25/01/00001',
                stok: '10',
                harga: '15000',
                fotoPath: 'uploads/1700000000000-123456789.png',
                createdAt: '2025-01-01T02:03:04.000Z',
                updatedAt: '2025-01-01T02:03:04.000Z',
            },
        },
    })
    findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
    ) {
        return this.barangService.findOne(id);
    }


    @Patch(':id')
    @UseInterceptors(FileInterceptor('foto'))
    @ApiOperation({ summary: 'Update barang (supports multipart for photo)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                nama: { type: 'string', nullable: true, example: 'Barang Updated' },
                stok: { type: 'string', nullable: true, example: '5' },
                harga: { type: 'string', nullable: true, example: '17000' },
                foto: { type: 'string', format: 'binary' },
            },
            example: {
                nama: 'Barang Updated',
                stok: '5',
                harga: '17000',
            },
        },
    })
    @ApiOkResponse({
        description: 'Updated barang',
        schema: {
            example: {
                id: '7c68e75a-437e-4bd5-a3a1-376094ce6d0a',
                nama: 'Barang Test Update',
                kode: 'BRG/25/01/00001',
                stok: '15',
                harga: '17500',
                fotoPath: 'uploads/1700000500000-987654321.jpg',
                createdAt: '2025-01-01T02:03:04.000Z',
                updatedAt: '2025-01-02T10:11:12.000Z',
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
    @ApiOperation({ summary: 'Delete barang' })
    @ApiOkResponse({
        description: 'Deletion confirmation',
        schema: {
            example: {
                id: '7c68e75a-437e-4bd5-a3a1-376094ce6d0a',
            },
        },
    })
    remove(
        @Param('id', new ParseUUIDPipe()) id: string,
    ) {
        return this.barangService.remove(id);
    }


    @Post(':id/stock')
    @ApiOperation({ summary: 'Adjust stock (increase/decrease)' })
    @ApiOkResponse({
        description: 'Stock adjustment result',
        schema: {
            example: {
                barangId: '7c68e75a-437e-4bd5-a3a1-376094ce6d0a',
                totalStok: 15,
            },
        },
    })
    @ApiBody({
        description: 'Stock adjustment payload',
        schema: {
            type: 'object',
            properties: {
                delta: { type: 'integer', example: 5 },
                note: { type: 'string', nullable: true, example: 'Restock warehouse' },
                txnDate: { type: 'string', format: 'date', nullable: true, example: '2025-01-01' },
            },
            required: ['delta'],
            example: {
                delta: 5,
                note: 'Restock warehouse',
                txnDate: '2025-01-01',
            },
        },
    })
    adjustStock(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: AdjustStockDto,
    ) {
        return this.barangService.adjustStock(id, dto);
    }


    @Post(':id/price')
    @ApiOperation({ summary: 'Set harga barang per tanggal' })
    @ApiOkResponse({
        description: 'Harga berhasil diset',
        schema: {
            example: {
                barangId: '7c68e75a-437e-4bd5-a3a1-376094ce6d0a',
                harga: '17500',
                effectiveDate: '2025-01-01',
            },
        },
    })
    @ApiBody({
        description: 'Set price payload',
        schema: {
            type: 'object',
            properties: {
                harga: { type: 'string', example: '17500' },
                tanggalBerlaku: { type: 'string', format: 'date', example: '2025-01-01' },
            },
            required: ['harga', 'tanggalBerlaku'],
            example: {
                harga: '17500',
                tanggalBerlaku: '2025-01-01',
            },
        },
    })
    setPrice(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: SetPriceDto,
    ) {
        return this.barangService.setPrice(id, dto);
    }


    @Get('report/stock')
    @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
    @ApiOperation({ summary: 'Get aggregated stock per barang up to a date' })
    @ApiOkResponse({
        description: 'List total stock per barang',
        schema: {
            example: [
                { namaBarang: 'Barang Test', totalStok: 15 },
            ],
        },
    })
    getStockPerDate(@Query('date') date?: string) {
        if (!date) {
            throw new BadRequestException('date query parameter is required');
        }
        return this.barangService.getStockPerDate(date);
    }


    @Get('report/price')
    @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
    @ApiOperation({ summary: 'Get harga berlaku per barang pada tanggal tertentu' })
    @ApiOkResponse({
        description: 'List harga per barang',
        schema: {
            example: [
                { namaBarang: 'Barang Test', harga: 17500 },
            ],
        },
    })
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
