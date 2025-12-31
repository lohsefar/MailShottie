import { NextResponse } from "next/server";

export async function GET() {
  // Check which SMTP env vars are set (without exposing values)
  const envCheck = {
    SMTP_HOST: process.env.SMTP_HOST ? "✓ Set" : "✗ Missing",
    SMTP_PORT: process.env.SMTP_PORT ? `✓ Set (${process.env.SMTP_PORT})` : "✗ Missing (default: 587)",
    SMTP_USER: process.env.SMTP_USER ? "✓ Set" : "✗ Missing",
    SMTP_PASS: process.env.SMTP_PASS ? "✓ Set" : "✗ Missing",
  };

  return NextResponse.json({
    message: "Environment variable check",
    env: envCheck,
    note: "Restart your dev server if you just added/updated .env.local",
  });
}

