import { NextResponse } from "next/server";

export function GET() {
  return new NextResponse(
    "google.com, pub-5046405557715049, DIRECT, f08c47fec0942fa0",
    { headers: { "Content-Type": "text/plain" } }
  );
}
