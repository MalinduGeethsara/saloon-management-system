import { NextResponse } from 'next/server';

// Logs the real error server-side but only ever sends a generic message to the client —
// raw Prisma/DB error text can leak column/table/constraint names to an attacker.
export function serverError(message: string, error: unknown, status = 500) {
  console.error(message, error);
  return NextResponse.json({ message }, { status });
}
