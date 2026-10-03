import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Customer from '@/models/Customer';
import { handleError } from '@/lib/errorHandler';

const ALLOWED_FIELDS = ['name', 'email', 'phone', 'company', 'address', 'status', 'notes'];

function pickAllowed(body = {}) {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status') || '';
    const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit'), 10) || 10, 1), 100);

    const filter = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { company: rx }];
    }
    if (status === 'active' || status === 'inactive') filter.status = status;

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Customer.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: customers,
      pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const customer = await Customer.create(pickAllowed(body));
    return NextResponse.json({ data: customer, message: 'Customer created' }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
