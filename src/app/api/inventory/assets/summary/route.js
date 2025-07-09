/**
 * @file Mendefinisikan endpoint API untuk mengambil data agregat aset.
 * @path /api/assets/aggregate-summary
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { authorizeRole } from '@/lib/services/roleValidation';
import { getAssetAggregateSummary } from '@/lib/services/assetServices';
import connectToDatabase from '@/database/database';

/**
 * GET: Mengambil ringkasan data aset yang diagregasi, dengan dukungan filter dan paginasi.
 */
export async function GET(request) {
  await connectToDatabase()
  try {
    const session = await getServerSession(authOptions);
    authorizeRole(session); // Memastikan pengguna terautentikasi

    const { searchParams } = new URL(request.url);

    // Mengumpulkan semua filter dari URL
    const filters = {};
    const allowedFilters = [
      'q', 'productName', 'brandName', 'locationName','estimated_price'
    ];

    allowedFilters.forEach(key => {
      if (searchParams.has(key)) {
        filters[key] = searchParams.get(key);
      }
    });

    // Panggil service dengan semua parameter yang relevan
    const result = await getAssetAggregateSummary({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      order: searchParams.get('order'),
      filters,
    });

    // Kembalikan hasil yang sudah mencakup data dan info paginasi
    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    console.error("Error in GET /api/assets/summary:", error.message);
    const status = error.status || 500;
    const message = error.message || "Terjadi kesalahan pada server.";
    return NextResponse.json({ success: false, message }, { status });
  }
}
