/**
 * @file Mendefinisikan endpoint API untuk mengambil daftar aset (paginasi) dan membuat aset.
 * @path /api/assets
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth'; // Sesuaikan path jika berbeda
import { authorizeRole } from '@/lib/services/roleValidation';
import { getPaginatedAssets, createAssets } from '@/lib/services/assetServices'; // Service backend yang akan kita buat nanti
import connectToDatabase from '@/database/database';

export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    authorizeRole(session);

    const { searchParams } = new URL(request.url);
    
    const filters = {
      serial_number: searchParams.get('serial_number'),
      product: searchParams.get('product'),
      productId: searchParams.get('productId'),
      location: searchParams.get('location'),
      locationId: searchParams.get('locationId'),
      condition: searchParams.get('condition'),
      purchased_year: searchParams.get('purchased_year'),
      estimated_price: searchParams.get('estimated_price'),
      q: searchParams.get('q'),
    };
    
    const result = await getPaginatedAssets({
      page : searchParams.get('page'),
      limit: searchParams.get('limit'),
      filters,
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error) {
    // 5. Tangani error
    const status = error.status || 500;
    const message = error.message || "Terjadi kesalahan pada server.";
    
    console.error("Error in GET /api/assets:", error.message);
    
    return NextResponse.json({ success: false, message }, { status });
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const validationResponse = authorizeRole(session);
    if (!validationResponse.success) {
      return NextResponse.json(
        { message: validationResponse.messages },
        { status: validationResponse.status }
      );
    }

    const data = await request.json();
    
    const newAssets = await createAssets(data);

    return NextResponse.json({ success: true, data: newAssets, message: `${newAssets.length} aset berhasil dibuat.` }, { status: 201 });

  } catch (error) {
    // Tangani error validasi dari Zod
    if (error.isValidationError) {
      return NextResponse.json({ success: false, message: error.message, errors: error.errors }, { status: 400 });
    }
    // Tangani error duplikasi dari database
    if (error.isDuplicate) {
      return NextResponse.json({ success: false, message: error.message }, { status: 409 });
    }
    
    console.error("Error in POST /api/assets:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}