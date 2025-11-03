-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barang_counter" (
    "id" TEXT NOT NULL,
    "yy" VARCHAR(2) NOT NULL,
    "mm" VARCHAR(2) NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "barang_counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barang" (
    "id" TEXT NOT NULL,
    "nama" VARCHAR(128) NOT NULL,
    "kode" VARCHAR(20) NOT NULL,
    "foto_path" VARCHAR(255),
    "stok" INTEGER NOT NULL DEFAULT 0,
    "harga" DECIMAL(18,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "barang_id" TEXT NOT NULL,
    "harga" DECIMAL(18,2) NOT NULL,
    "effective_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_ledger" (
    "id" TEXT NOT NULL,
    "barang_id" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "txn_date" DATE NOT NULL,
    "note" VARCHAR(128),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "barang_counter_yy_mm_key" ON "barang_counter"("yy", "mm");

-- CreateIndex
CREATE UNIQUE INDEX "barang_kode_key" ON "barang"("kode");

-- CreateIndex
CREATE INDEX "price_history_barang_id_effective_date_idx" ON "price_history"("barang_id", "effective_date");

-- CreateIndex
CREATE INDEX "stock_ledger_barang_id_txn_date_idx" ON "stock_ledger"("barang_id", "txn_date");

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_barang_id_fkey" FOREIGN KEY ("barang_id") REFERENCES "barang"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_barang_id_fkey" FOREIGN KEY ("barang_id") REFERENCES "barang"("id") ON DELETE CASCADE ON UPDATE CASCADE;
