
/**
 * @file /lib/services/dashboardServices.js
 * Service terpusat untuk mengambil data agregat untuk dashboard.
 */
import Asset from "@/models/Asset";
import ConsumableStock from '@/models/ConsumableStock';
import ConsumableLog from '@/models/ConsumableLog';
import ConsumableProduct from '@/models/ConsumableProduct';

// import { StockTransaction } from '@/models/StockTransaction';

/**
 * Mengambil data ringkasan untuk kartu di dashboard.
 */
export async function getDashboardSummary() {
  const totalAssets = await Asset.countDocuments();
  
  // Menjumlahkan semua kuantitas dari koleksi Stock
  const totalStockResult = await ConsumableStock.aggregate([
    { $group: { _id: null, total: { $sum: "$quantity" } } }
  ]);
  const totalStock = totalStockResult[0]?.total || 0;

  return { totalAssets, totalStock };
}

export async function getLowStockItems(limit = 5) {
  const items = await ConsumableStock.aggregate([
    // Tahap 1: Filter item stok yang rendah
    {
      $match: {
        $expr: { $lte: ["$quantity", "$reorder_point"] }
      }
    },
    // Tahap 2: Urutkan hasil sebelum di-limit untuk performa
    {
      $sort: { quantity: 1 }
    },
    // Tahap 3: Batasi jumlah hasil
    {
      $limit: limit
    },
    // Tahap 4: Gabungkan dengan detail produk
    {
      $lookup: {
        from: 'consumableproducts', // Nama koleksi produk habis pakai (biasanya bentuk jamak lowercase)
        localField: 'product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    // Tahap 5: Buka array hasil lookup
    {
      $unwind: {
        path: "$productDetails",
        preserveNullAndEmptyArrays: true // Jaga item stok jika produknya terhapus
      }
    },
    // Tahap 6: Bentuk ulang output (project) sesuai permintaan
    {
      $project: {
        _id: 1, // Pertahankan _id dari item stok
        productId: "$productDetails._id",
        productName: "$productDetails.name",
        quantity: 1,
        unit: 1
      }
    }
  ]);
  return items;
}

/**
 * Mengambil transaksi stok terbaru menggunakan Aggregation Pipeline.
 */
export async function getRecentStockTransactions(limit = 7) {
  const transactions = await ConsumableLog.aggregate([
    // Tahap 1: Urutkan berdasarkan tanggal terbaru
    { $sort: { createdAt: -1 } },
    // Tahap 2: Batasi hasil
    { $limit: limit },
    // Tahap 3: Join dengan ConsumableStock
    {
      $lookup: {
        from: 'consumablestocks', // Nama koleksi (biasanya jamak & lowercase)
        localField: 'stock_item',
        foreignField: '_id',
        as: 'stock_item'
      }
    },
    { $unwind: { path: '$stock_item', preserveNullAndEmptyArrays: true } },
    // Tahap 4: Join dengan ConsumableProduct
    {
      $lookup: {
        from: 'consumableproducts',
        localField: 'stock_item.product',
        foreignField: '_id',
        as: 'stock_item.product'
      }
    },
    { $unwind: { path: '$stock_item.product', preserveNullAndEmptyArrays: true } },
    // Tahap 5: Join dengan User
    {
      $lookup: {
        from: 'users', // Nama koleksi pengguna
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  ]);
  return transactions;
}