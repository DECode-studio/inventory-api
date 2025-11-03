import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { HmacSignatureGuard } from './common/guards/hmac-signature.guard';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BarangModule } from './barang/barang.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BarangModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: HmacSignatureGuard },
  ],
})
export class AppModule { }
