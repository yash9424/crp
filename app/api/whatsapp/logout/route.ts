import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = await fetch('http://localhost:3004/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.WHATSAPP_API_KEY || 'default-key'
      }
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to logout' });
  }
}