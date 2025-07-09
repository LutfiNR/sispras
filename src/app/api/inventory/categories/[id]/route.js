/**
 * @file Mendefinisikan endpoint API untuk operasi pada satu kategori spesifik (/api/categories/[id]).
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { authorizeRole } from '@/lib/services/roleValidation';
import connectToDatabase from '@/database/database';

// Impor semua fungsi service terkait kategori
import {
  getCategoryById,
  updateCategoryById,
  deleteCategoryById
} from '@/lib/services/categoryServices';

/**
 * Menangani permintaan GET untuk mengambil detail satu kategori berdasarkan ID.
 */
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    authorizeRole(session); // Memastikan pengguna sudah login

    const { id } = params;
    const category = await getCategoryById(id);
    
    return NextResponse.json({ success: true, data: category });

  } catch (error) {
    const status = error.isNotFound ? 404 : error.status || 500;
    const message = error.message || "Terjadi kesalahan pada server.";
    
    console.error(`Error in GET /api/categories/${params.id}:`, error);
    
    return NextResponse.json({ success: false, message }, { status });
  }
}

/**
 * Menangani permintaan PUT untuk memperbarui satu kategori berdasarkan ID.
 */
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    authorizeRole(session, ['admin', 'manager']); // Hanya role tertentu yang bisa update

    const { id } = params;
    const data = await request.json();
    const updatedCategory = await updateCategoryById(id, data);

    return NextResponse.json({ 
        success: true, 
        message: "Kategori berhasil diperbarui.",
        data: updatedCategory 
    });

  } catch (error) {
    const status = error.isValidationError ? 400 
                 : error.isDuplicate ? 409 
                 : error.isNotFound ? 404
                 : 500;
    const message = error.message || "Terjadi kesalahan pada server.";
    const errors = error.isValidationError ? error.errors : undefined;

    console.error(`Error in PUT /api/categories/${params.id}:`, error);

    return NextResponse.json({ success: false, message, errors }, { status });
  }
}

/**
 * Menangani permintaan DELETE untuk menghapus satu kategori berdasarkan ID.
 */
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    authorizeRole(session, ['admin']); // Hanya admin yang bisa hapus

    const { id } = params;
    await deleteCategoryById(id);

    return NextResponse.json({ success: true, message: 'Kategori berhasil dihapus.' });

  } catch (error) {
    const status = error.isNotFound ? 404 
                 : error.isConflict ? 409 
                 : 500;
    const message = error.message || "Terjadi kesalahan pada server.";

    console.error(`Error in DELETE /api/categories/${params.id}:`, error);
    
    return NextResponse.json({ success: false, message }, { status });
  }
}
