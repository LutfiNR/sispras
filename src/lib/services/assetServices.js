
/**
 * @file Layanan terpusat untuk mengelola semua logika bisnis terkait Aset.
 */

import mongoose, { Types } from "mongoose";
import { z } from "zod";
import Asset from "@/models/Asset";
import { generateSerialNumber } from "@/lib/services/generateSerialNumber";
import Product from "@/models/Product";

// Skema untuk form pendaftaran BANYAK aset
const assetBulkSchema = z.object({
  product: z.string().min(1, "Produk harus dipilih."),
  location: z.string().min(1, "Lokasi harus dipilih."),
  purchased_year: z.string().optional(),
  quantity: z.number().int().min(1, "Jumlah harus minimal 1."),
  estimated_price: z.number().min(0, "Harga harus angka positif.").optional(),
  condition: z.enum(["Baik", "Rusak", "Kurang Baik"]).default("Baik"),
  attributes: z.record(z.any()).optional(),
});

const assetUpdateSchema = z.object({
  condition: z.enum(["Baik", "Rusak", "Kurang Baik"]).optional(),
  purchased_year: z.string().optional(), // Sesuai model Mongoose Anda
  estimated_price: z.preprocess(
    // Mengubah string kosong menjadi undefined agar validasi number tidak gagal
    (val) => (val === "" || val == null ? undefined : Number(val)),
    z.number().min(0, "Harga harus angka positif.").optional()
  ),
  attributes: z.record(z.any()).optional(),
});

/**
 * BE Service: Mengambil daftar aset individual dengan paginasi, filter, dan sorting.
 * @param {object} options - Opsi query
 * @returns {Promise<object>} - Hasil yang siap dikirim ke API Route.
 */
export async function getPaginatedAssets({
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  order = "desc",
  filters = {},
}) {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;
  const sortOptions = { [sortBy]: order === "desc" ? -1 : 1 };

  const pipeline = [];

  // Tahap 1: Populasi Data (Lookup)
  pipeline.push(
    { $lookup: { from: "products", localField: "product", foreignField: "_id", as: "product" } },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "locations", localField: "location", foreignField: "_id", as: "location" } },
    { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "brands", localField: "product.brand", foreignField: "_id", as: "product.brand" } },
    { $unwind: { path: "$product.brand", preserveNullAndEmptyArrays: true } }
  );

  // Tahap 2: Logika Filter Dinamis
  const matchConditions = [];
  const { q, ...columnFilters } = filters;

  if (q) {
    matchConditions.push({
      $or: [
        { serial_number: { $regex: q, $options: "i" } },
        { "product.name": { $regex: q, $options: "i" } },
        { "location.name": { $regex: q, $options: "i" } },
        { "product.brand.name": { $regex: q, $options: "i" } },
        { condition: { $regex: q, $options: "i" } },
        { status: { $regex: q, $options: "i" } },
      ],
    });
  }

  // Logika Filter Kolom yang Cerdas
  for (const key in columnFilters) {
    if (columnFilters[key]) {
      const filterValue = columnFilters[key];
      let condition;

      // Cek apakah nilai filter adalah ObjectId yang valid
      const isObjectId = mongoose.Types.ObjectId.isValid(filterValue);

      switch (key) {
        case "product":
          condition = isObjectId
            ? { 'product._id': new mongoose.Types.ObjectId(filterValue) }
            : { 'product.name': { $regex: filterValue, $options: 'i' } };
          break;
        case "location":
          condition = isObjectId
            ? { 'location._id': new mongoose.Types.ObjectId(filterValue) }
            : { 'location.name': { $regex: filterValue, $options: 'i' } };
          break;
        case "brand":
            condition = {'product.brand.name': { $regex: filterValue, $options: 'i' }}
          break;
        default:
          // Untuk field lain (seperti condition, status), gunakan pencarian teks biasa.
          condition = { [key]: { $regex: filterValue, $options: 'i' } };
          break;
      }
      matchConditions.push(condition);
    }
  }

  if (matchConditions.length > 0) {
    pipeline.push({ $match: { $and: matchConditions } });
  }

  // Tahap 3: Paginasi dan Penghitungan Total
  pipeline.push({
    $facet: {
      data: [{ $sort: sortOptions }, { $skip: skip }, { $limit: limitNum }],
      metadata: [{ $count: "totalItems" }],
    },
  });

  const result = await Asset.aggregate(pipeline);
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

export async function createAssets(data) {
  const validation = assetBulkSchema.safeParse(data);
  if (!validation.success) {
    const validationError = new Error("Input tidak valid.");
    validationError.isValidationError = true;
    validationError.errors = validation.error.flatten().fieldErrors;
    throw validationError;
  }

  const {
    quantity,
    product: productId,
    location: locationId,
    ...commonData
  } = validation.data;

  const selectedProduct = await Product.findById(productId).select('product_code').lean();
  if (!selectedProduct) {
    throw new Error(`Produk dengan ID ${productId} tidak ditemukan.`);
  }
  const targetProductCode = selectedProduct.product_code;

  // 2. Buat pipeline agregasi untuk menghitung aset
  const aggregationResult = await Asset.aggregate([
    // Tahap 1: Gabungkan (lookup) dengan koleksi 'products'
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    // Tahap 2: Filter hasil gabungan
    {
      $match: {
        'location': new mongoose.Types.ObjectId(locationId),
        'productDetails.product_code': targetProductCode
      }
    },
    // Tahap 3: Hitung dokumen yang cocok
    {
      $count: 'total'
    }
  ]);

  // Hasil agregasi adalah array, misal: [{ total: 5 }]. Jika kosong, berarti 0.
  const assetCountInLocation = aggregationResult[0]?.total || 0;


  const assetsToCreate = [];

  // Persiapkan setiap dokumen aset baru dalam satu array
  for (let i = 0; i < quantity; i++) {
    const nextSequence = assetCountInLocation + i + 1;

    // Generate nomor seri unik untuk setiap aset
    const newSerialNumber = await generateSerialNumber(productId, locationId, nextSequence);

    assetsToCreate.push({
      ...commonData,
      product: productId,
      location: locationId,
      serial_number: newSerialNumber,
    });
  }

  try {
    // Masukkan semua aset baru ke database dalam satu operasi
    const createdAssets = await Asset.insertMany(assetsToCreate, { ordered: true });
    return createdAssets;
  } catch (error) {
    if (error.code === 11000) {
      // Error ini terjadi jika ada duplikasi nomor seri
      const duplicateError = new Error(`Gagal membuat aset. Nomor Seri yang digenerate sudah ada.`);
      duplicateError.isDuplicate = true;
      throw duplicateError;
    }
    throw error;
  }
}

export async function getAssetById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const notFoundError = new Error("ID Aset tidak valid.");
    notFoundError.isNotFound = true;
    throw notFoundError;
  }

  const asset = await Asset.findById(id)
    .populate({
      path: "product",
      select: "name brand measurement_unit",
      populate: { path: "brand", select: "name" },
    })
    .populate({ path: "location", select: "name floor building" })
    .lean();

  if (!asset) {
    const notFoundError = new Error("Aset tidak ditemukan.");
    notFoundError.isNotFound = true;
    throw notFoundError;
  }

  return asset;
}

/**
 * BE Service: Memperbarui satu aset berdasarkan ID.
 */
export async function updateAssetById(id, data) {

  const validation = assetUpdateSchema.safeParse(data);
  if (!validation.success) {
    const validationError = new Error("Input tidak valid.");
    validationError.isValidationError = true;
    validationError.errors = validation.error.flatten().fieldErrors;
    throw validationError;
  }

  // Jika frontend mengirim field lain (seperti product atau location),
  // `validation.data` akan secara otomatis menghapusnya, sehingga aman.
  const updatedAsset = await Asset.findByIdAndUpdate(
    id,
    validation.data, // Hanya data yang lolos validasi yang diupdate
    { new: true, runValidators: true }
  ).lean();

  if (!updatedAsset) {
    const notFoundError = new Error("Aset tidak ditemukan untuk diperbarui.");
    notFoundError.isNotFound = true;
    throw notFoundError;
  }
  return updatedAsset;
}


/**
 * BE Service: Menghapus satu aset berdasarkan ID.
 */
export async function deleteAssetById(id) {
  const deletedAsset = await Asset.findByIdAndDelete(id);

  if (!deletedAsset) {
    const notFoundError = new Error("Aset tidak ditemukan untuk dihapus.");
    notFoundError.isNotFound = true;
    throw notFoundError;
  }

  // Tidak ada yang perlu dikembalikan jika sukses
}

/**
 * BE Service: Menjalankan pipeline agregasi untuk meringkas data aset, dengan filter dan paginasi.
 * @param {object} options - Opsi query termasuk filters, page, limit, sortBy, order.
 * @returns {Promise<object>} - Hasil data aset yang telah diagregasi beserta info paginasi.
 */
export async function getAssetAggregateSummary({
  page = 1,
  limit = 10,
  sortBy = "productName", // Default sort berdasarkan nama produk
  order = "asc",
  filters = {},
}) {
  // --- PERSIAPAN PAGINASI ---
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;
  const sortOptions = { [sortBy]: order === "desc" ? -1 : 1 };

  const pipeline = [];

  // --- Tahap 1: Lakukan semua join/lookup terlebih dahulu ---
  pipeline.push(
    { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'productDetails' } },
    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'locations', localField: 'location', foreignField: '_id', as: 'locationDetails' } },
    { $unwind: { path: "$locationDetails", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'brands', localField: 'productDetails.brand', foreignField: '_id', as: 'brandDetails' } },
    { $unwind: { path: "$brandDetails", preserveNullAndEmptyArrays: true } }
  );

  // --- Tahap 2: Bangun kondisi filter dinamis ---
  const matchConditions = [];
  const { q, ...columnFilters } = filters;

  if (q) {
    matchConditions.push({
      $or: [
        { "productDetails.name": { $regex: q, $options: "i" } },
        { "locationDetails.name": { $regex: q, $options: "i" } },
        { "brandDetails.name": { $regex: q, $options: "i" } },
      ],
    });
  }

  for (const key in columnFilters) {
    if (columnFilters[key]) {
      const filterValue = columnFilters[key];
      let fieldPath = key;
      switch (key) {
        case 'productName': fieldPath = 'productDetails.name'; break;
        case 'locationName': fieldPath = 'locationDetails.name'; break;
        case 'brandName': fieldPath = 'brandDetails.name'; break;
        // Filter untuk field yang tidak berubah nama
        case 'estimated_price':
            const price = parseFloat(filterValue);
            if (!isNaN(price)) { matchConditions.push({ [key]: price }); continue; }
            break;
      }
      if (key !== 'estimated_price') {
        matchConditions.push({ [fieldPath]: { $regex: filterValue, $options: "i" } });
      }
    }
  }

  if (matchConditions.length > 0) {
    pipeline.push({ $match: { $and: matchConditions } });
  }

  // --- Tahap 3: Kelompokkan aset berdasarkan produk, lokasi, dan kondisi ---
  pipeline.push({
    $group: {
      _id: {
        // Kunci utama pengelompokan
        productName: "$productDetails.name",
        brandName: "$brandDetails.name",
        locationName: "$locationDetails.name",
        building: "$locationDetails.building",
        floor: "$locationDetails.floor",
      },
      // Ambil nilai dari field lain dari dokumen pertama dalam grup
      productId: { $first: "$productDetails._id" },
      locationId: { $first: "$locationDetails._id" },
      purchased_year: { $first: "$purchased_year" },
      estimated_price: { $first: "$estimated_price" },
      // Hitung jumlah aset dalam grup ini
      jumlah: { $sum: 1 } 
    }
  });

  // --- Tahap 4: Gunakan $facet untuk Paginasi & Penghitungan Total ---
  pipeline.push({
    $facet: {
      // Sub-pipeline untuk data halaman ini
      data: [
        // Proyeksikan data dari hasil $group ke format yang diinginkan
        { $project: {
            _id: 0, 
            productId: "$productId",
            locationId: "$locationId",
            productName: "$_id.productName", 
            brandName: "$_id.brandName",
            building: "$_id.building",
            floor: "$_id.floor",
            room: "$_id.locationName",
            purchased_year: "$purchased_year",
            estimated_price: "$estimated_price",
            jumlah: "$jumlah"
        }},
        { $sort: sortOptions },
        { $skip: skip },
        { $limit: limitNum },
      ],
      // Sub-pipeline untuk metadata (hanya menghitung total grup)
      metadata: [
        { $count: 'totalItems' },
      ],
    },
  });

  // --- Eksekusi Pipeline ---
  const result = await Asset.aggregate(pipeline);

  // --- Struktur Respons Akhir ---
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
