import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BarangService } from './barang.service';
import { BarangController } from './barang.controller';


const uploadDir = join(process.cwd(), 'uploads');


@Module({
    imports: [
        MulterModule.register({
            storage: diskStorage({
                destination: (_req, _file, cb) => {
                    if (!existsSync(uploadDir)) {
                        mkdirSync(uploadDir, { recursive: true });
                    }
                    cb(null, uploadDir);
                },
                filename: (_req, file, cb) => {
                    const ext = file.originalname?.split('.').pop();
                    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                    cb(null, ext ? `${unique}.${ext}` : unique);
                },
            }),
        }),
    ],
    providers: [BarangService],
    controllers: [BarangController],
})
export class BarangModule { }
