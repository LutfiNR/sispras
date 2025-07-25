/**
 * @file Layanan terpusat untuk mengelola semua logika bisnis terkait Inventaris Habis Pakai.
 */

import { z } from 'zod';
import mongoose, { Types } from 'mongoose';

// Impor Model
import ConsumableProduct from '@/models/ConsumableProduct';
import ConsumableStock from '@/models/ConsumableStock';
import ConsumableLog from '@/models/ConsumableLog';
import Category from '@/models/Category';

// --- Skema Validasi Zod ---
const consumableProductSchema = z.object({
  product_code: z.string().trim().min(1, "Kode produk wajib diisi."),
  name: z.string().trim().min(1, "Nama produk wajib diisi."),
  category: z.string().refine((val) => Types.ObjectId.isValid(val), "ID Kategori tidak valid."),
  measurement_unit: z.string().trim().min(1, "Satuan unit produk wajib diisi."),
  reorder_point: z.number().int().min(1, "Minimum Stock produk wajib diisi."),
});

const restockSchema = z.object({
  productId: z.string().refine((val) => Types.ObjectId.isValid(val), "ID Produk tidak valid."),
  quantityAdded: z.number().int().min(1, "Jumlah harus minimal 1."),
  notes: z.string().trim().optional(),
  person_name: z.string().trim().min(1, "Nama penambah stok wajib diisi."),
  person_role: z.string().trim().optional(),
});

const usageSchema = z.object({
  stockItemId: z.string().refine((val) => Types.ObjectId.isValid(val), "ID Stok tidak valid."),
  quantityTaken: z.number().int().min(1, "Jumlah harus minimal 1."),
  person_name: z.string().trim().min(1, "Nama pengambil wajib diisi."),
  person_role: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
// -------------------------

// ===================================================================================
//  OPERASI PADA KATALOG PRODUK HABIS PAKAI (ConsumableProduct)
// ===================================================================================

export async function getPaginatedConsumableProducts({ page = 1, limit = 10, sortBy = 'name', order = 'asc', filters = {} }) {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;
  const sortOptions = { [sortBy]: order === 'desc' ? -1 : 1 };
  const pipeline = [];

  const matchConditions = [];
  const { q, category } = filters;
  if (q) {
    matchConditions.push({ $or: [{ name: { $regex: q, $options: 'i' } }, { product_code: { $regex: q, $options: 'i' } }] });
  }
  if (category) {
    matchConditions.push({ category: new mongoose.Types.ObjectId(category) });
  }
  if (matchConditions.length > 0) {
    pipeline.push({ $match: { $and: matchConditions } });
  }

  pipeline.push(
    { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }
  );

  pipeline.push({
    $facet: {
      data: [
        { $sort: sortOptions },
        { $skip: skip },
        { $limit: limitNum },
        { $project: { categoryName: '$category.name', name: 1, product_code: 1, createdAt: 1, measurement_unit: 1, reorder_point: 1 } }
      ],
      metadata: [{ $count: 'totalItems' }]
    }
  });

  const result = await ConsumableProduct.aggregate(pipeline);
  const data = result[0]?.data || [];
  const totalItems = result[0]?.metadata[0]?.totalItems || 0;
  return { data, pagination: { totalItems, currentPage: pageNum, totalPages: Math.ceil(totalItems / limitNum), limit: limitNum } };
}

export async function getAllConsumableProductsForDropdown() {
  return await ConsumableProduct.find({}).select('name product_code measurement_unit').sort({ name: 1 }).lean();
}

export async function createConsumableProduct(data) {
  const validation = consumableProductSchema.safeParse(data);
  if (!validation.success) {
    const error = new Error("Input tidak valid.");
    error.isValidationError = true;
    error.errors = validation.error.flatten().fieldErrors;
    throw error;
  }
  try {
    return await ConsumableProduct.create(validation.data);
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error(`Produk dengan nama atau kode yang sama sudah ada.`);
      error.isDuplicate = true;
      throw error;
    }
    throw err;
  }
}

export async function getConsumableProductById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("ID Produk tidak valid.");
    error.isNotFound = true;
    throw error;
  }
  const product = await ConsumableProduct.findById(id).populate('category', 'name').lean();
  if (!product) {
    const error = new Error('Produk habis pakai tidak ditemukan.');
    error.isNotFound = true;
    throw error;
  }
  return product;
}

export async function updateConsumableProductById(id, data) {
  console.log(data)
  const validation = consumableProductSchema.partial().safeParse(data);
  if (!validation.success) {
    const error = new Error("Input tidak valid.");
    error.isValidationError = true;
    error.errors = validation.error.flatten().fieldErrors;
    throw error;
  }
  try {
    const updatedProduct = await ConsumableProduct.findByIdAndUpdate(id, validation.data, { new: true, runValidators: true }).lean();
    if (!updatedProduct) {
      const error = new Error('Produk tidak ditemukan untuk diperbarui.');
      error.isNotFound = true;
      throw error;
    }
    return updatedProduct;
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error(`Produk dengan nama atau kode yang sama sudah ada.`);
      error.isDuplicate = true;
      throw error;
    }
    throw err;
  }
}

export async function deleteConsumableProductById(id) {
  const stockCount = await ConsumableStock.countDocuments({ product: id });
  if (stockCount > 0) {
    const error = new Error(`Produk tidak dapat dihapus karena sudah memiliki data stok.`);
    error.isConflict = true;
    throw error;
  }
  const deletedProduct = await ConsumableProduct.findByIdAndDelete(id);
  if (!deletedProduct) {
    const error = new Error('Produk tidak ditemukan untuk dihapus.');
    error.isNotFound = true;
    throw error;
  }
}

// ===================================================================================
//  OPERASI PADA STOK & LOG
// ===================================================================================

export async function getPaginatedConsumableStock({ page = 1, limit = 10, sortBy = 'product.name', order = 'asc', filters = {} }) {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;
  const sortOptions = { [sortBy]: order === 'desc' ? -1 : 1 };
  const pipeline = [];

  // Tahap 1: Join dengan Produk
  pipeline.push(
    { $lookup: { from: 'consumableproducts', localField: 'product', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' }
  );

  // Tahap 2: Filter
  const matchConditions = [];
  const { q } = filters;
  if (q) {
    matchConditions.push({ $or: [{ 'product.name': { $regex: q, $options: 'i' } }, { 'product.product_code': { $regex: q, $options: 'i' } }] });
  }
  if (matchConditions.length > 0) {
    pipeline.push({ $match: { $and: matchConditions } });
  }

  // Tahap 3: Paginasi
  pipeline.push({
    $facet: {
      data: [{ $sort: sortOptions }, { $skip: skip }, { $limit: limitNum }, {
        $project: {
          _id: 1, // Pertahankan _id dari ConsumableStock
          quantity: 1,
          createdAt: 1,
          updatedAt: 1,
          // Bentuk ulang field 'product' agar hanya berisi data yang relevan
          product: {
            _id: "$product._id",
            name: "$product.name",
            product_code: "$product.product_code",
            measurement_unit: "$product.measurement_unit",
            reorder_point: "$product.reorder_point"
          }
        }
      }],
      metadata: [{ $count: 'totalItems' }]
    }
  });

  const result = await ConsumableStock.aggregate(pipeline);
  const data = result[0]?.data || [];
  const totalItems = result[0]?.metadata[0]?.totalItems || 0;
  return { data, pagination: { totalItems, currentPage: pageNum, totalPages: Math.ceil(totalItems / limitNum), limit: limitNum } };
}

/**
 * [BARU] Mengambil detail satu item stok berdasarkan ID-nya.
 * @param {string} id - ID dari dokumen ConsumableStock.
 * @returns {Promise<object>} Dokumen stok yang ditemukan.
 */
export async function getConsumableStockById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("ID Stok tidak valid.");
    error.isNotFound = true;
    throw error;
  }

  // Ambil data stok dan populate detail produknya
  const stockItem = await ConsumableStock.findById(id)
    .populate({
      path: 'product',
      model: ConsumableProduct, // Pastikan model di-referensikan dengan benar
      select: 'name product_code measurement_unit reorder_point', // Ambil semua field yang relevan
    })
    .lean();

  if (!stockItem) {
    const error = new Error('Item stok tidak ditemukan.');
    error.isNotFound = true;
    throw error;
  }
  return stockItem;
}

/**
 * Mengambil riwayat transaksi (log) dengan paginasi dan filter yang lengkap.
 * @param {object} options - Opsi untuk query.
 * @returns {Promise<object>} Objek berisi data log dan informasi paginasi.
 */
export async function getPaginatedConsumableLogs({ page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', filters = {} }) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sortOptions = { [sortBy]: order === 'desc' ? -1 : 1 };
    const pipeline = [];

    // --- Tahap 1: Join Bertingkat ---
    pipeline.push(
        { $lookup: { from: 'consumablestocks', localField: 'stock_item', foreignField: '_id', as: 'stock_item' } },
        { $unwind: '$stock_item' },
        { $lookup: { from: 'consumableproducts', localField: 'stock_item.product', foreignField: '_id', as: 'stock_item.product' } },
        { $unwind: '$stock_item.product' },
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
    );

    // --- Tahap 2: Logika Filter Dinamis ---
    const matchConditions = [];
    const { q, ...columnFilters } = filters;
    
    // Filter pencarian cepat (q)
    if (q) {
        matchConditions.push({ $or: [
            { 'stock_item.product.name': { $regex: q, $options: 'i' } },
            { 'person_name': { $regex: q, $options: 'i' } },
            { 'notes': { $regex: q, $options: 'i' } },
            { 'user.name': { $regex: q, $options: 'i' } },
        ]});
    }

    // Filter per kolom dari DataGrid
    for (const key in columnFilters) {
        if (columnFilters[key]) {
            const filterValue = columnFilters[key];
            let condition;
            
            // Logika spesifik untuk setiap field filter
            switch (key) {
                case 'createdAt':
                    const date = new Date(filterValue);
                    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
                    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
                    condition = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
                    break;
                case 'quantity_changed':
                    const quantity = parseInt(filterValue, 10);
                    if (!isNaN(quantity)) {
                        condition = { [key]: quantity };
                    }
                    break;
                default:
                    condition = { [key]: { $regex: filterValue, $options: 'i' } };
                    break;
            }
            if (condition) {
                matchConditions.push(condition);
            }
        }
    }

    // Jika ada kondisi filter, tambahkan tahap $match ke pipeline
    if (matchConditions.length > 0) {
        pipeline.push({ $match: { $and: matchConditions } });
    }

    // --- Tahap 3: Paginasi ---
    pipeline.push({
        $facet: {
            data: [{ $sort: sortOptions }, { $skip: skip }, { $limit: limitNum }],
            metadata: [{ $count: 'totalItems' }]
        }
    });

    const result = await ConsumableLog.aggregate(pipeline);
    const data = result[0]?.data || [];
    const totalItems = result[0]?.metadata[0]?.totalItems || 0;
    
    return { 
        data, 
        pagination: { 
            totalItems, 
            currentPage: pageNum, 
            totalPages: Math.ceil(totalItems / limitNum), 
            limit: limitNum 
        } 
    };
}

export async function recordRestock(data, userId) {
  const validation = restockSchema.safeParse(data);
  if (!validation.success) {
    const error = new Error("Input tidak valid.");
    error.isValidationError = true;
    error.errors = validation.error.flatten().fieldErrors;
    throw error;
  }
  const { productId, quantityAdded, unit, notes, person_name, person_role } = validation.data;

  const dbSession = await mongoose.startSession();
  try {
    let result;
    await dbSession.withTransaction(async () => {
      let stockItem = await ConsumableStock.findOne({ product: productId }).session(dbSession);
      if (!stockItem) {
        stockItem = new ConsumableStock({ product: productId, quantity: 0, unit: unit });
      }
      stockItem.quantity += quantityAdded;
      await stockItem.save({ session: dbSession });

      const [newLog] = await ConsumableLog.create([{
        stock_item: stockItem._id,
        transaction_type: 'penambahan',
        quantity_changed: quantityAdded,
        person_name,
        person_role,
        notes,
        user: userId,
      }], { session: dbSession });

      result = { stockItem, log: newLog };
    });
    return result;
  } finally {
    await dbSession.endSession();
  }
}

export async function recordUsage(data, userId) {
  const validation = usageSchema.safeParse(data);
  if (!validation.success) {
    const error = new Error("Input tidak valid.");
    error.isValidationError = true;
    error.errors = validation.error.flatten().fieldErrors;
    throw error;
  }
  const { stockItemId, quantityTaken, notes, person_name, person_role } = validation.data;

  const dbSession = await mongoose.startSession();
  try {
    let result;
    await dbSession.withTransaction(async () => {
      const stockItem = await ConsumableStock.findById(stockItemId).session(dbSession);
      if (!stockItem) throw new Error(`Stok item tidak ditemukan.`);
      if (stockItem.quantity < quantityTaken) throw new Error(`Stok tidak mencukupi. Stok saat ini: ${stockItem.quantity}.`);

      stockItem.quantity -= quantityTaken;
      await stockItem.save({ session: dbSession });

      const [newLog] = await ConsumableLog.create([{
        stock_item: stockItem._id,
        transaction_type: 'pengambilan',
        quantity_changed: quantityTaken,
        person_name,
        person_role,
        notes,
        user: userId,
      }], { session: dbSession });

      result = { stockItem, log: newLog };
    });
    return result;
  } finally {
    await dbSession.endSession();
  }
}
