import { NextRequest, NextResponse } from "next/server";
import { POST as authTestPost } from "@/app/api/auth/token-test/route";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body.token || process.env.GEE_PRIVATE_KEY || "";
    const type = body.type || "gee";

    const forwardedReq = new NextRequest(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({ token, type }),
    });

    return authTestPost(forwardedReq);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, valid: false, error: err?.message || "Erro no teste de token" },
      { status: 500 }
    );
  }
}
