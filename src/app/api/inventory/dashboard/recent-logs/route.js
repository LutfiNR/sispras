/**
 * @file /app/api/dashboard/recent-logs/route.js
 * Endpoint untuk transaksi stok terbaru.
 */
import { NextResponse } from 'next/server';
import { getRecentStockTransactions } from '@/lib/services/dashboardServices';
import connectToDatabase from '@/database/database';
import { getServerSession } from 'next-auth';
import { authorizeRole } from '@/lib/services/roleValidation';
import { authOptions } from '@/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
        authorizeRole(session);
    await connectToDatabase();
    const transactions = await getRecentStockTransactions();
    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
