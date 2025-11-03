import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ensureDatabaseUrl } from '../src/prisma/prisma.utils';
import { PrismaService } from '../src/prisma/prisma.service';
import { buildSignature } from './utils/signature';


type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';


const rawBodySaver = (req: any, _res: any, buf: Buffer) => {
  if (buf?.length) {
    req.rawBody = buf;
  }
};


let databaseUrl: string | null = null;
try {
  databaseUrl = ensureDatabaseUrl();
} catch (err) {
  // databaseUrl stays null; test suite will be skipped.
}


if (!databaseUrl) {
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('Inventory API (e2e)', () => {
    it('skipped because DATABASE_URL/DB_* env vars are not set', () => {
      expect(true).toBe(true);
    });
  });
} else {
  process.env.API_KEY_ID = process.env.API_KEY_ID || 'test-key';
  process.env.API_SECRET = process.env.API_SECRET || 'test-secret';
  process.env.API_SIG_TTL = process.env.API_SIG_TTL || '600';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
  process.env.JWT_EXPIRES = process.env.JWT_EXPIRES || '1d';

  describe('Inventory API (e2e)', () => {
    let app: INestApplication;
    let server: any;
    let accessToken: string | undefined;
    let createdUserId: string | undefined;
    let barangId: string | undefined;
    let prisma: PrismaService;


    beforeAll(async () => {
      prisma = new PrismaService();
      await prisma.onModuleInit();
      await resetDatabase(prisma);

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).overrideProvider(PrismaService).useValue(prisma).compile();

      app = moduleFixture.createNestApplication();
      app.use(json({ verify: rawBodySaver }));
      app.use(urlencoded({ verify: rawBodySaver, extended: true }));
      app.setGlobalPrefix('api');
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await app.init();

      server = app.getHttpServer();
    });


    afterAll(async () => {
      await app.close();
      await prisma.onModuleDestroy();
    });


    afterEach(async () => {
      await resetDatabase(prisma);
      accessToken = undefined;
      createdUserId = undefined;
      barangId = undefined;
    });


    const signedRequest = (
      method: HttpMethod,
      path: string,
      options: {
        body?: any;
        token?: string;
        query?: Record<string, string>;
        multipart?: Record<string, string>;
      } = {},
    ) => {
      const headers = buildSignature(method, path, options.multipart ?? options.body ?? '');
      let req = request(server)[method.toLowerCase() as Lowercase<HttpMethod>](path).set(headers);
      if (options.token) {
        req = req.set('Authorization', `Bearer ${options.token}`);
      }

      if (options.query) {
        req = req.query(options.query);
      }

      if (options.multipart) {
        Object.entries(options.multipart).forEach(([key, value]) => {
          req = req.field(key, value);
        });
        return req;
      }

      if (options.body !== undefined) {
        req = req.send(options.body);
      }

      return req;
    };


    it('registers a user and provides JWT token on login', async () => {
      const registerDto = { username: 'admin', password: 'secret123' };

      await signedRequest('POST', '/api/auth/register', { body: registerDto })
        .expect(201)
        .expect(({ body }) => {
          expect(body).toHaveProperty('id');
          expect(body).toHaveProperty('username', registerDto.username);
        });

      const loginDto = { username: registerDto.username, password: registerDto.password };

      await signedRequest('POST', '/api/auth/login', { body: loginDto })
        .expect(201)
        .expect(({ body }) => {
          expect(body).toHaveProperty('access_token');
          accessToken = body.access_token;
        });
    });


    it('supports user CRUD via protected endpoints', async () => {
      await bootstrapAuth();

      const createDto = { username: 'staff', password: 'staff123' };

      await signedRequest('POST', '/api/users', { body: createDto, token: accessToken })
        .expect(201)
        .expect(({ body }) => {
          expect(body).toMatchObject({ username: createDto.username });
          createdUserId = body.id;
        });

      await signedRequest('GET', '/api/users', { token: accessToken })
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body)).toBe(true);
          expect(body.find((u: any) => u.id === createdUserId)).toBeTruthy();
        });

      const updateDto = { password: 'updated123' };
      await signedRequest('PATCH', `/api/users/${createdUserId}`, { body: updateDto, token: accessToken })
        .expect(200)
        .expect(({ body }) => {
          expect(body).toHaveProperty('id', createdUserId);
        });

      await signedRequest('DELETE', `/api/users/${createdUserId}`, { token: accessToken })
        .expect(200)
        .expect(({ body }) => {
          expect(body).toMatchObject({ id: createdUserId });
        });
    });


    it('manages barang lifecycle including stock and price reports', async () => {
      await bootstrapAuth();

      const barangDto = { nama: 'Barang Test', stok: '10', harga: '15000' };

      await signedRequest('POST', '/api/barang', {
        multipart: barangDto,
        token: accessToken,
      })
        .expect(201)
        .expect(({ body }) => {
          expect(body).toHaveProperty('id');
          expect(body).toHaveProperty('kode');
          expect(body).toHaveProperty('stok', '10');
          barangId = body.id;
        });

      await signedRequest('GET', '/api/barang', { token: accessToken })
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body)).toBe(true);
          expect(body.some((b: any) => b.id === barangId)).toBe(true);
        });

      const adjustDto = { delta: 5, note: 'restock', txnDate: '2025-01-01' };
      await signedRequest('POST', `/api/barang/${barangId}/stock`, {
        body: adjustDto,
        token: accessToken,
      })
        .expect(201)
        .expect(({ body }) => {
          expect(body).toMatchObject({ barangId, totalStok: 15 });
        });

      const priceDto = { harga: '17500', tanggalBerlaku: '2025-01-01' };
      await signedRequest('POST', `/api/barang/${barangId}/price`, {
        body: priceDto,
        token: accessToken,
      })
        .expect(201)
        .expect(({ body }) => {
          expect(body).toMatchObject({ barangId, harga: priceDto.harga });
        });

      await signedRequest('GET', '/api/barang/report/stock', {
        token: accessToken,
        query: { date: '2025-01-02' },
      })
        .expect(200)
        .expect(({ body }) => {
          const row = body.find((item: any) => item.namaBarang === 'Barang Test');
          expect(row).toBeDefined();
          expect(row.totalStok).toBe(15);
        });

      await signedRequest('GET', '/api/barang/report/price', {
        token: accessToken,
        query: { date: '2025-01-02' },
      })
        .expect(200)
        .expect(({ body }) => {
          const row = body.find((item: any) => item.namaBarang === 'Barang Test');
          expect(row).toBeDefined();
          expect(Number(row.harga)).toBeCloseTo(17500);
        });
    });


    const bootstrapAuth = async () => {
      if (accessToken) return;
      const registerDto = { username: 'admin', password: 'secret123' };
      await signedRequest('POST', '/api/auth/register', { body: registerDto })
        .expect(201);

      const loginDto = { username: registerDto.username, password: registerDto.password };
      await signedRequest('POST', '/api/auth/login', { body: loginDto })
        .expect(201)
        .expect(({ body }) => {
          accessToken = body.access_token;
        });
    };
  });
}


async function resetDatabase(prisma: PrismaService) {
  const tables = ['price_history', 'stock_ledger', 'barang', 'barang_counter', 'users'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM ${table};`);
  }
}
