import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/admin"];

function redirectToLogin(request: NextRequest, reason?: string) {
	const loginUrl = new URL("/login", request.url);
	loginUrl.searchParams.set(
		"callbackUrl",
		`${request.nextUrl.pathname}${request.nextUrl.search}`,
	);
	if (reason) {
		loginUrl.searchParams.set("reason", reason);
	}

	const response = NextResponse.redirect(loginUrl);
	response.cookies.delete("tuwaga.session_token");
	response.cookies.delete("tuwaga.session_data");
	return response;
}

export async function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const isProtected = protectedPrefixes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);

	if (!isProtected) {
		return NextResponse.next();
	}

	const sessionCookie = getSessionCookie(request, {
		cookiePrefix: "tuwaga",
	});

	if (!sessionCookie) {
		return redirectToLogin(request);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*"],
};
