/* eslint-disable */
/**
 * @file /models/Stock.js
 * Model untuk data master inventaris sementara (barang habis pakai).
 */
import mongoose, { Schema, model, models } from 'mongoose';

const StockSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'ConsumableProduct', required: true, unique: true },
  quantity: { type: Number, default: 0, min: 0 },
  unit: { type: String, required: true },
  reorder_point: { type: Number, default: 10 }, // Ambang batas stok rendah
}, { timestamps: true });

export const Stock = models.Stock || model('Stock', StockSchema);


/**
 * @file /models/StockTransaction.js
 * Model untuk mencatat setiap transaksi stok masuk dan keluar.
 */
const StockTransactionSchema = new Schema({
  stock_item: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
  type: { type: String, enum: ['penambahan', 'pengambilan'], required: true },
  quantity_changed: { type: Number, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  person_name: { type: String, required: true },
  person_role: { type: String },
  notes: { type: String, trim: true },
}, { timestamps: true });

export const StockTransaction = models.StockTransaction || model('StockTransaction', StockTransactionSchema);


/**
 * @file /lib/services/dashboardServices.js
 * Service terpusat untuk mengambil data agregat untuk dashboard.
 */
import Asset from "@/models/Asset";
// Impor model Stock dan StockTransaction yang baru dibuat di atas
// import { Stock } from '@/models/Stock';
// import { StockTransaction } from '@/models/StockTransaction';

/**
 * Mengambil data ringkasan untuk kartu di dashboard.
 */
export async function getDashboardSummary() {
  const totalAssets = await Asset.countDocuments();
  
  // Menjumlahkan semua kuantitas dari koleksi Stock
  const totalTempStockResult = await Stock.aggregate([
    { $group: { _id: null, total: { $sum: "$quantity" } } }
  ]);
  const totalTempStock = totalTempStockResult[0]?.total || 0;

  return { totalAssets, totalTempStock };
}

/**
 * Mengambil daftar item dengan stok di bawah ambang batas minimum.
 */
export async function getLowStockItems(limit = 5) {
  const items = await Stock.find({ $expr: { $lte: ["$quantity", "$reorder_point"] } })
    .populate('product', 'name')
    .sort({ quantity: 1 })
    .limit(limit)
    .lean();
  return items;
}

/**
 * Mengambil transaksi stok terbaru.
 */
export async function getRecentStockTransactions(limit = 5) {
  const transactions = await StockTransaction.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({
        path: 'stock_item',
        select: 'unit product',
        populate: {
            path: 'product',
            select: 'name'
        }
    })
    .populate('user', 'name') // Ambil nama pengguna sistem
    .lean();
  return transactions;
}
