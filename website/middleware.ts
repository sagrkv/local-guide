import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // =========================================================================
  // City slug detection from subdomain (production) or path (development)
  // =========================================================================
  let citySlug: string | null = null;

  // Production: parse city slug from subdomain
  // e.g., mysore.localguide.in -> citySlug = "mysore"
  const productionDomain = "localguide.in";
  if (hostname.endsWith(`.${productionDomain}`)) {
    const subdomain = hostname.replace(`.${productionDomain}`, "");
    // Ignore www and other system subdomains
    if (subdomain && subdomain !== "www" && subdomain !== "api" && subdomain !== "admin") {
      citySlug = subdomain;
    }
  }

  // Development: use path-based routing /explore/:citySlug
  if (!citySlug && url.pathname.startsWith("/explore/")) {
    const segments = url.pathname.split("/");
    if (segments.length >= 3 && segments[2]) {
      citySlug = segments[2];
    }
  }

  // If we detected a city slug from subdomain, rewrite to the explore route
  // so the page component can access it via params
  if (citySlug && !url.pathname.startsWith("/explore/")) {
    const newUrl = url.clone();
    newUrl.pathname = `/explore/${citySlug}${url.pathname}`;

    const response = NextResponse.rewrite(newUrl);
    response.headers.set("x-city-slug", citySlug);
    return response;
  }

  // Set city slug header if available (for downstream pages)
  if (citySlug) {
    const response = NextResponse.next();
    response.headers.set("x-city-slug", citySlug);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
