/**
 * @file Layanan terpusat untuk mengelola semua logika bisnis terkait Kategori.
 */

import { z } from 'zod';
import mongoose from 'mongoose';
import Category from '@/models/Category';
import Product from '@/models/Product';

// Skema Zod untuk validasi data kategori yang masuk.
const categorySchema = z.object({
  name: z.string({ required_error: "Nama kategori wajib diisi." }).trim().min(1, { message: 'Nama kategori tidak boleh kosong.' }),
  description: z.string().trim().optional(),
});

// ===================================================================================
//  OPERASI PADA KOLEKSI (Banyak Kategori)
// ===================================================================================

/**
 * Mengambil daftar kategori dengan paginasi, sorting, dan filter menggunakan Aggregation Pipeline.
 * @param {object} options - Opsi untuk query.
 * @returns {Promise<object>} Objek berisi data dan informasi paginasi.
 */
export async function getPaginatedCategories({ page = 1, limit = 10, sortBy = 'name', order = 'asc', filters = {} }) {
  
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;
  const sortOptions = { [sortBy]: order === 'desc' ? -1 : 1 };

  const pipeline = [];

  // --- Tahap 1: Filter (jika ada) ---
  const matchConditions = [];
  const { q, name } = filters;

  if (q) {
    matchConditions.push({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ],
    });
  }
  if (name) {
    matchConditions.push({ name: { $regex: name, $options: 'i' } });
  }

  if (matchConditions.length > 0) {
    pipeline.push({ $match: { $and: matchConditions } });
  }
  
  // --- Tahap 2: Menghitung jumlah produk terkait untuk setiap kategori ---
  pipeline.push(
    {
      $lookup: {
        from: 'products', // Nama koleksi produk
        localField: '_id',
        foreignField: 'category',
        as: 'products'
      }
    },
    {
      $addFields: {
        productCount: { $size: '$products' } // Hitung jumlah elemen dalam array 'products'
      }
    }
  );

  // --- Tahap 3: Paginasi dan Penghitungan Total menggunakan $facet ---
  pipeline.push({
    $facet: {
      data: [
        { $project: { products: 0 } }, // Hapus array 'products' yang besar dari hasil akhir
        { $sort: sortOptions },
        { $skip: skip },
        { $limit: limitNum }
      ],
      metadata: [
        { $count: 'totalItems' }
      ]
    }
  });

  const result = await Category.aggregate(pipeline);

  const data = result[0]?.data || [];
  const totalItems = result[0]?.metadata[0]?.totalItems || 0;

  return {
    data,
    pagination: {
      totalItems,
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
      limit: limitNum,
    },
  };
}

/**
 * Mengambil daftar semua kategori dari database (untuk dropdown).
 */
export async function getAllCategoriesForDropdown() {
  const categories = await Category.find({}).sort({ name: 1 }).lean();
  return categories;
}

/**
 * Membuat kategori baru.
 */
export async function createCategory(data) {
  const validation = categorySchema.safeParse(data);
  if (!validation.success) {
    const validationError = new Error('Input tidak valid.');
    validationError.isValidationError = true;
    validationError.errors = validation.error.flatten().fieldErrors;
    throw validationError;
  }

  await connectToDatabase();
  try {
    const newCategory = await Category.create(validation.data);
    return newCategory;
  } catch (error) {
    if (error.code === 11000) {
      const duplicateError = new Error(`Kategori dengan nama "${validation.data.name}" sudah ada.`);
      duplicateError.isDuplicate = true;
      throw duplicateError;
    }
    throw error;
  }
}

// ===================================================================================
//  OPERASI PADA DOKUMEN TUNGGAL (Berdasarkan ID)
// ===================================================================================

export async function getCategoryById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const notFoundError = new Error("ID Kategori tidak valid.");
        notFoundError.isNotFound = true;
        throw notFoundError;
    }
    const category = await Category.findById(id).lean();
    if (!category) {
        const notFoundError = new Error('Kategori tidak ditemukan.');
        notFoundError.isNotFound = true;
        throw notFoundError;
    }
    return category;
}

export async function updateCategoryById(id, data) {
    const validation = categorySchema.partial().safeParse(data);
    if (!validation.success) {
        const validationError = new Error('Input tidak valid.');
        validationError.isValidationError = true;
        validationError.errors = validation.error.flatten().fieldErrors;
        throw validationError;
    }
    try {
        const updatedCategory = await Category.findByIdAndUpdate(id, validation.data, { new: true, runValidators: true }).lean();
        if (!updatedCategory) {
            const notFoundError = new Error('Kategori tidak ditemukan untuk diperbarui.');
            notFoundError.isNotFound = true;
            throw notFoundError;
        }
        return updatedCategory;
    } catch (error) {
        if (error.code === 11000) {
            const duplicateError = new Error(`Kategori dengan nama "${data.name}" sudah ada.`);
            duplicateError.isDuplicate = true;
            throw duplicateError;
        }
        throw error;
    }
}

export async function deleteCategoryById(id) {
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
        const conflictError = new Error(`Kategori tidak dapat dihapus karena masih digunakan oleh ${productCount} produk.`);
        conflictError.isConflict = true;
        throw conflictError;
    }
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
        const notFoundError = new Error('Kategori tidak ditemukan untuk dihapus.');
        notFoundError.isNotFound = true;
        throw notFoundError;
    }
}
