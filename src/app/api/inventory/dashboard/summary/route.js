/**
 * @file /app/api/dashboard/summary/route.js
 * Endpoint untuk data ringkasan.
 */
import { NextResponse } from 'next/server';
import { getDashboardSummary } from '@/lib/services/dashboardServices';
import connectToDatabase from '@/database/database';
// ... (impor otentikasi jika perlu)

export async function GET(request) {
  try {
    await connectToDatabase();
    const summary = await getDashboardSummary();
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
