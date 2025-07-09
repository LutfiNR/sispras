

/**
 * @file /app/api/dashboard/low-stock/route.js
 * Endpoint untuk data stok rendah.
 */
import { NextResponse } from 'next/server';
import { getLowStockItems } from '@/lib/services/dashboardServices';
import connectToDatabase from '@/database/database';
import { getServerSession } from 'next-auth';
import { authorizeRole } from '@/lib/services/roleValidation';
import { authOptions } from '@/auth';
// ... (impor otentikasi jika perlu)

export async function GET(request) {
  await connectToDatabase();
  try {
    const session = await getServerSession(authOptions);
    authorizeRole(session);
    const items = await getLowStockItems();
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
