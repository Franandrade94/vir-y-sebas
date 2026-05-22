import { verifyAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const ok = await verifyAdminSession();
  return Response.json({ ok });
}
