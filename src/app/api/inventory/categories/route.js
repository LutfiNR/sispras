/**
 * @file Mendefinisikan endpoint API untuk resource kategori (/api/categories).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth"; // Menyesuaikan path auth
import { authorizeRole } from "@/lib/services/roleValidation"; // Menggunakan role validation standar

// Impor fungsi-fungsi dari service layer untuk kategori
import {
    createCategory,
    getPaginatedCategories,
    getAllCategoriesForDropdown,
} from "@/lib/services/categoryServices"; // Asumsi path service-nya
import connectToDatabase from "@/database/database";

/**
 * Menangani permintaan GET untuk mengambil data kategori.
 * Mendukung mode 'semua data' dan 'paginasi'.
 */
export async function GET(request) {
    try {
        await connectToDatabase();
        const session = await getServerSession(authOptions);
        authorizeRole(session); // Cukup cek apakah pengguna sudah login

        const { searchParams } = new URL(request.url);

        // --- Logika Pembeda: Apakah mengambil semua data atau paginasi? ---
        if (searchParams.get("all") === "true") {
            const allCategories = await getAllCategoriesForDropdown();
            return NextResponse.json({ success: true, data: allCategories });
        }
        // ---------------------------------------------------------------

        // --- Logika untuk Paginasi dan Filter ---
        const filters = {
            name: searchParams.get("name"),
            q: searchParams.get("q"),
        };

        const result = await getPaginatedCategories({
            page: searchParams.get("page"),
            limit: searchParams.get("limit"),
            sortBy: searchParams.get("sortBy"),
            order: searchParams.get("order"),
            filters,
        });

        return NextResponse.json({ success: true, ...result });

    } catch (error) {
        console.error("Error in GET /api/categories:", error.message);
        const status = error.status || 500;
        const message = error.message || "Terjadi kesalahan pada server.";
        return NextResponse.json({ success: false, message }, { status });
    }
}

/**
 * Menangani permintaan POST untuk membuat kategori baru.
 */
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
        const newCategory = await createCategory(data);

        return NextResponse.json(
            { success: true, data: newCategory, message: "Kategori berhasil dibuat." },
            { status: 201 }
        );
    } catch (error) {
        // Penanganan error yang lebih terpusat
        const status = error.isValidationError ? 400
            : error.isDuplicate ? 409
                : 500;
        const message = error.message || "Terjadi kesalahan pada server.";
        const errors = error.isValidationError ? error.errors : undefined;

        console.error("Error in POST /api/categories:", error.message);

        return NextResponse.json({ success: false, message, errors }, { status });
    }
}
