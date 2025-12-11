import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const token = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret"
    );

    return NextResponse.json({
      id: decoded.id,
      role: decoded.role,
      email: decoded.email, // IMPORTANTÍSIMO
    });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
