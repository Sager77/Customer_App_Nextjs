import { NextResponse } from 'next/server';

export function handleError(err) {
  if (err.name === 'ValidationError') {
    const errors = {};
    for (const [path, detail] of Object.entries(err.errors)) {
      errors[path] = detail.message;
    }
    return NextResponse.json({ message: 'Please fix the highlighted fields', errors }, { status: 400 });
  }

  if (err.name === 'CastError') {
    return NextResponse.json({ message: `Invalid ${err.path}: ${err.value}` }, { status: 400 });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return NextResponse.json({
      message: `A customer with this ${field} already exists`,
      errors: { [field]: `This ${field} is already in use` },
    }, { status: 409 });
  }

  console.error(err);
  return NextResponse.json({ message: err.message || 'Server error' }, { status: err.status || 500 });
}
