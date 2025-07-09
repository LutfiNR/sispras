/**
 * @file Mendefinisikan endpoint API untuk resource produk habis pakai.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { authorizeRole } from '@/lib/services/roleValidation';
import connectToDatabase from '@/database/database';

import {
    createConsumableProduct,
    getPaginatedConsumableProducts,
    getAllConsumableProductsForDropdown
} from '@/lib/services/consumableServices';

export async function GET(request) {
    try {
        await connectToDatabase();
        const session = await getServerSession(authOptions);
        authorizeRole(session);

        const { searchParams } = new URL(request.url);
        if (searchParams.get("all") === "true") {
            const products = await getAllConsumableProductsForDropdown();
            return NextResponse.json({ success: true, data: products });
        }

        // Mengumpulkan semua filter dari URL
        const filters = {};
        const allowedFilters = ['q', 'name', 'category', 'product_code'];
        allowedFilters.forEach(key => {
            if (searchParams.has(key)) {
                filters[key] = searchParams.get(key);
            }
        });

        const result = await getPaginatedConsumableProducts({
            page: searchParams.get("page"),
            limit: searchParams.get("limit"),
            sortBy: searchParams.get("sortBy"),
            order: searchParams.get("order"),
            filters,
        });

        return NextResponse.json({ success: true, ...result });

    } catch (error) {
        console.error("Error in GET /api/consumable-products:", error);
        const status = error.status || 500;
        const message = error.message || "Terjadi kesalahan pada server.";
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
        const newProduct = await createConsumableProduct(data);

        return NextResponse.json({
            success: true,
            data: newProduct,
            message: "Produk habis pakai berhasil dibuat."
        }, { status: 201 });

    } catch (error) {
        const status = error.isValidationError ? 400
            : error.isDuplicate ? 409
                : 500;
        const message = error.message || "Terjadi kesalahan pada server.";
        const errors = error.isValidationError ? error.errors : undefined;

        console.error("Error in POST /api/consumable-products:", error);

        return NextResponse.json({ success: false, message, errors }, { status });
    }
}
