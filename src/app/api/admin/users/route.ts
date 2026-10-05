import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { syncRoleToAuth } from "@/lib/auth-role-sync";
import { TUWAGA_ROLES, type TuwagaRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Akses ditolak. Hanya admin yang dapat mengelola daftar pengguna.",
        },
        { status: 403 },
      );
    }

    const pool = getAuthPool();
    const roleFilter = request.nextUrl.searchParams.get("role");
    if (
      roleFilter &&
      !(TUWAGA_ROLES as readonly string[]).includes(roleFilter)
    ) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }
    const result = await pool.query(
      `
      SELECT id, name, email, role, image, "createdAt"
      FROM "user"
      WHERE $1::text IS NULL OR role = $1
      ORDER BY
        CASE
          WHEN role = 'admin' THEN 1
          WHEN role = 'organizer' OR role = 'panitia' THEN 2
          WHEN role = 'eo' THEN 3
          ELSE 4
        END,
        "createdAt" DESC
      LIMIT 100
    `,
      [roleFilter],
    );

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar pengguna" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Akses ditolak. Hanya admin yang dapat mengubah peran pengguna.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { userId, email, role } = body as {
      userId?: string;
      email?: string;
      role?: string;
    };

    const targetRole =
      typeof role === "string"
        ? role.toLowerCase() === "panitia"
          ? "organizer"
          : role.toLowerCase()
        : undefined;

    if (
      !targetRole ||
      !(TUWAGA_ROLES as readonly string[]).includes(targetRole)
    ) {
      return NextResponse.json(
        { error: `Role tidak valid. Pilihan role: admin, organizer, eo, user` },
        { status: 400 },
      );
    }

    if (!userId && !email) {
      return NextResponse.json(
        { error: "userId atau email wajib diisi" },
        { status: 400 },
      );
    }

    const pool = getAuthPool();
    const target = userId
      ? await pool.query<{ email: string }>(
          'SELECT email FROM "user" WHERE id = $1',
          [userId],
        )
      : await pool.query<{ email: string }>(
          'SELECT email FROM "user" WHERE LOWER(email) = LOWER($1)',
          [email],
        );
    if (target.rows.length !== 1)
      return NextResponse.json(
        { error: "Pengguna harus login ke Tuwaga terlebih dahulu" },
        { status: 404 },
      );
    try {
      await syncRoleToAuth(target.rows[0].email, targetRole as TuwagaRole);
    } catch (error) {
      console.error("Auth role synchronization failed", error);
      return NextResponse.json(
        {
          error:
            "Sinkronisasi peran ke Auth gagal. Coba lagi setelah Auth siap.",
        },
        { status: 503 },
      );
    }
    let query: string;
    let params: unknown[];

    if (userId) {
      query = `
        UPDATE "user"
        SET role = $1, "updatedAt" = NOW()
        WHERE id = $2
        RETURNING id, name, email, role
      `;
      params = [targetRole, userId];
    } else {
      query = `
        UPDATE "user"
        SET role = $1, "updatedAt" = NOW()
        WHERE LOWER(email) = LOWER($2)
        RETURNING id, name, email, role
      `;
      params = [targetRole, email];
    }

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          error:
            "Pengguna tidak ditemukan di database. Pastikan pengguna sudah pernah login minimal 1 kali dengan Google sebelum ditetapkan rolenya.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Peran berhasil diubah menjadi ${targetRole}`,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update user role:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui peran pengguna" },
      { status: 500 },
    );
  }
}
