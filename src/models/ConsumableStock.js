/**
 * @file Mendefinisikan skema dan model Mongoose untuk 'ConsumableStock'.
 * Skema ini melacak jumlah total dari setiap produk habis pakai.
 */

import mongoose, { Schema, model, models } from 'mongoose';

const ConsumableStockSchema = new Schema(
  {
    /**
     * Referensi ke produk habis pakai yang stoknya dilacak.
     */
    product: {
      type: Schema.Types.ObjectId,
      ref: 'ConsumableProduct',
      required: true,
      unique: true, // Setiap produk hanya boleh memiliki satu entri stok
    },
    /**
     * Jumlah total stok yang tersedia saat ini.
     */
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

const ConsumableStock = models.ConsumableStock || model('ConsumableStock', ConsumableStockSchema);
export default ConsumableStock;
