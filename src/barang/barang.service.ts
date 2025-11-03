import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBarangDto } from './dto/create-barang.dto';
import { UpdateBarangDto } from './dto/update-barang.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { SetPriceDto } from './dto/set-price.dto';


@Injectable()
export class BarangService {
    constructor(private readonly prisma: PrismaService) { }


    private async nextKode(): Promise<string> {
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');


        const counter = await this.prisma.$transaction(async (tx) => {
            return tx.barangCounter.upsert({
                where: { yy_mm: { yy, mm } },
                create: { yy, mm, counter: 1 },
                update: { counter: { increment: 1 } },
            });
        });


        const seq = String(counter.counter).padStart(5, '0');
        return `BRG/${yy}/${mm}/${seq}`;
    }


    async create(dto: CreateBarangDto) {
        const stokValue = this.parseIntOrThrow(dto.stok, 'stok');
        const hargaValue = this.parseDecimal(dto.harga);
        const kode = await this.nextKode();
        const today = this.todayDateString();


        const barang = await this.prisma.$transaction(async (tx) => {
            const created = await tx.barang.create({
                data: {
                    nama: dto.nama,
                    kode,
                    fotoPath: dto.fotoPath,
                    stok: stokValue,
                    harga: hargaValue,
                },
                select: this.selectFields(),
            });


            if (stokValue !== 0) {
                const createdId = (created as any).id as string;
                await tx.stockLedger.create({
                    data: {
                        barangId: createdId,
                        delta: stokValue,
                        note: 'Initial stock',
                        txnDate: new Date(today),
                    },
                });
            }


            if (hargaValue !== undefined) {
                const createdId = (created as any).id as string;
                await tx.priceHistory.create({
                    data: {
                        barangId: createdId,
                        harga: hargaValue,
                        effectiveDate: new Date(today),
                    },
                });
            }


            return created;
        });


        return this.toResponse(barang);
    }


    async findAll() {
        const items = await this.prisma.barang.findMany({
            orderBy: { createdAt: 'desc' },
            select: this.selectFields(),
        });
        return items.map((b) => this.toResponse(b));
    }


    async findOne(id: string) {
        const barang = await this.prisma.barang.findUnique({
            where: { id },
            select: this.selectFields(),
        });
        if (!barang) {
            throw new NotFoundException('Barang not found');
        }
        return this.toResponse(barang);
    }


    async update(id: string, dto: UpdateBarangDto) {
        await this.ensureExists(id);


        const data: Record<string, unknown> = {};
        if (dto.nama !== undefined) data.nama = dto.nama;
        if (dto.fotoPath !== undefined) data.fotoPath = dto.fotoPath;
        if (dto.stok !== undefined) data.stok = this.parseIntOrThrow(dto.stok, 'stok');
        if (dto.harga !== undefined) data.harga = this.parseDecimal(dto.harga);


        const updated = await this.prisma.barang.update({
            where: { id },
            data,
            select: this.selectFields(),
        });
        return this.toResponse(updated);
    }


    async remove(id: string) {
        await this.ensureExists(id);
        await this.prisma.barang.delete({ where: { id } });
        return { id };
    }


    async adjustStock(barangId: string, dto: AdjustStockDto) {
        if (!Number.isInteger(dto.delta)) {
            throw new BadRequestException('delta must be an integer');
        }


        const txnDate = dto.txnDate ?? this.todayDateString();
        const total = await this.prisma.$transaction(async (tx) => {
            await this.ensureExists(barangId, tx);
            await tx.stockLedger.create({
                data: {
                    barangId,
                    delta: dto.delta,
                    note: dto.note,
                    txnDate: new Date(txnDate),
                },
            });
            const updated = await tx.barang.update({
                where: { id: barangId },
                data: { stok: { increment: dto.delta } },
                select: { stok: true },
            });
            return updated.stok;
        });


        return { barangId, totalStok: total };
    }


    async setPrice(barangId: string, dto: SetPriceDto) {
        const hargaValue = this.parseDecimal(dto.harga, 'harga');
        if (hargaValue === undefined) {
            throw new BadRequestException('harga is required');
        }
        const effectiveDate = dto.tanggalBerlaku;


        await this.prisma.$transaction(async (tx) => {
            await this.ensureExists(barangId, tx);
            await tx.priceHistory.create({
                data: {
                    barangId,
                    harga: hargaValue,
                    effectiveDate: new Date(effectiveDate),
                },
            });
            await tx.barang.update({
                where: { id: barangId },
                data: { harga: hargaValue },
            });
        });


        return { barangId, harga: hargaValue, effectiveDate };
    }


    async getStockPerDate(date: string) {
        const rows = await this.prisma.$queryRaw<{ nama: string; total_stok: number }[]>`
            SELECT b.nama, COALESCE(SUM(s.delta), 0) AS total_stok
            FROM barang b
            LEFT JOIN stock_ledger s
                ON s.barang_id = b.id
               AND s.txn_date <= ${date}
            GROUP BY b.id
            ORDER BY b.nama ASC
        `;
        return rows.map((row) => ({
            namaBarang: row.nama,
            totalStok: Number(row.total_stok),
        }));
    }


    async getPricePerDate(date: string) {
        const rows = await this.prisma.$queryRaw<{ nama: string; harga: unknown }[]>`
            SELECT b.nama,
                   (
                       SELECT p.harga
                       FROM price_history p
                       WHERE p.barang_id = b.id
                         AND p.effective_date <= ${date}
                       ORDER BY p.effective_date DESC, p.created_at DESC
                       LIMIT 1
                   ) AS harga
            FROM barang b
            ORDER BY b.nama ASC
        `;
        return rows.map((row) => ({
            namaBarang: row.nama,
            harga: row.harga !== null && row.harga !== undefined ? Number(row.harga as any) : null,
        }));
    }


    private selectFields(): Record<string, true> {
        return {
            id: true,
            nama: true,
            kode: true,
            fotoPath: true,
            stok: true,
            harga: true,
            createdAt: true,
            updatedAt: true,
        };
    }


    private async ensureExists(id: string, tx: any = this.prisma) {
        const barang = await tx.barang.findUnique({ where: { id }, select: { id: true } });
        if (!barang) throw new NotFoundException('Barang not found');
    }


    private toResponse(barang: any) {
        return {
            ...barang,
            stok: barang.stok.toString(),
            harga: barang.harga !== undefined && barang.harga !== null ? barang.harga.toString() : null,
        };
    }


    private parseIntOrThrow(value: string | undefined, field: string): number {
        if (value === undefined) return 0;
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
            throw new BadRequestException(`${field} must be an integer`);
        }
        return parsed;
    }


    private parseDecimal(value: string | undefined, field = 'harga') {
        if (value === undefined || value === null || value === '') return undefined;
        const num = Number(value);
        if (!Number.isFinite(num)) {
            throw new BadRequestException(`${field} must be a numeric string`);
        }
        return value;
    }


    private todayDateString(): string {
        return new Date().toISOString().slice(0, 10);
    }
}
