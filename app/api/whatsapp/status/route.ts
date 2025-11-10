import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://localhost:3004/status');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ ready: false, error: 'Service not running' });
  }
}

export async function POST() {
  try {
    const response = await fetch('http://localhost:3004/qr');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get QR code' });
  }
}