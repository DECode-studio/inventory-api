import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { APP_GUARD } from '@nestjs/core';
import { HmacSignatureGuard } from './common/guards/hmac-signature.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BarangModule } from './barang/barang.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: typeOrmConfig }),
    AuthModule,
    UsersModule,
    BarangModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: HmacSignatureGuard },
  ],
})
export class AppModule { }