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

export async function GET(request, { params }) {
  try {
    await connectDB();
    const customer = await Customer.findById(params.id);
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    return NextResponse.json({ data: customer });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const body = await request.json();
    const customer = await Customer.findByIdAndUpdate(params.id, pickAllowed(body), {
      new: true,
      runValidators: true,
    });
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    return NextResponse.json({ data: customer, message: 'Customer updated' });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const customer = await Customer.findByIdAndDelete(params.id);
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    return NextResponse.json({ data: { _id: customer._id }, message: 'Customer deleted' });
  } catch (error) {
    return handleError(error);
  }
}
