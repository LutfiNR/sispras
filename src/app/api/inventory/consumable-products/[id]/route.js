/**
 * @file Mendefinisikan endpoint API untuk operasi pada satu produk habis pakai spesifik.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { authorizeRole } from '@/lib/services/roleValidation';
import connectToDatabase from '@/database/database';

import {
  getConsumableProductById,
  updateConsumableProductById,
  deleteConsumableProductById
} from '@/lib/services/consumableServices';

/**
 * Menangani permintaan GET untuk mengambil detail satu produk habis pakai berdasarkan ID.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    authorizeRole(session);

    const product = await getConsumableProductById(id);

    return NextResponse.json({ success: true, data: product });

  } catch (error) {
    const status = error.isNotFound ? 404 : error.status || 500;
    const message = error.message || "Terjadi kesalahan pada server.";

    console.error(`Error in GET /api/consumable-products/${params.id}:`, error);

    return NextResponse.json({ success: false, message }, { status });
  }
}

/**
 * Menangani permintaan PUT untuk memperbarui satu produk habis pakai berdasarkan ID.
 */
export async function PUT(request, { params }) {
  const { id } = await params;
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
    const updatedProduct = await updateConsumableProductById(id, data);

    return NextResponse.json({
      success: true,
      message: "Produk berhasil diperbarui.",
      data: updatedProduct
    });

  } catch (error) {
    const status = error.isValidationError ? 400
      : error.isDuplicate ? 409
        : error.isNotFound ? 404
          : 500;
    const message = error.message || "Terjadi kesalahan pada server.";
    const errors = error.isValidationError ? error.errors : undefined;

    console.error(`Error in PUT /api/consumable-products/${params.id}:`, error);

    return NextResponse.json({ success: false, message, errors }, { status });
  }
}

/**
 * Menangani permintaan DELETE untuk menghapus satu produk habis pakai berdasarkan ID.
 */
export async function DELETE(request, { params }) {
  const { id } = await params;
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

    await deleteConsumableProductById(id);

    return NextResponse.json({ success: true, message: 'Produk berhasil dihapus.' });

  } catch (error) {
    const status = error.isNotFound ? 404
      : error.isConflict ? 409
        : 500;
    const message = error.message || "Terjadi kesalahan pada server.";

    console.error(`Error in DELETE /api/consumable-products/${params.id}:`, error);

    return NextResponse.json({ success: false, message }, { status });
  }
}
