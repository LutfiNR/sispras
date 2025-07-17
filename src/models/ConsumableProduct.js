/**
 * @file Mendefinisikan skema dan model Mongoose untuk 'ConsumableProduct'.
 * Skema ini merepresentasikan katalog untuk barang habis pakai.
 */

import mongoose, { Schema, model, models } from 'mongoose';

const ConsumableProductSchema = new Schema({
  /**
   * Kode unik internal untuk produk habis pakai.
   */
  product_code: {
    type: String,
    required: [true, 'Kode produk tidak boleh kosong.'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  /**
   * Nama dari produk habis pakai (contoh: "Spidol Snowman Biru").
   */
  name: {
    type: String,
    required: [true, 'Nama produk tidak boleh kosong.'],
    unique: true,
    trim: true,
  },
  /**
   * Referensi ke model 'Category' yang sudah ada.
   */
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Kategori tidak boleh kosong.'],
  },
  measurement_unit: {
    type: String,
    required: [true, 'Satuan pengukuran tidak boleh kosong.'],
  },
  reorder_point: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true
});

const ConsumableProduct = models.ConsumableProduct || model('ConsumableProduct', ConsumableProductSchema);

export default ConsumableProduct;
