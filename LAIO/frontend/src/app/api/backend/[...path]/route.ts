const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:8001";

const bodylessMethods = new Set(["GET", "HEAD"]);
const maxRequestBodyBytes = 1_048_576;
const forwardedResponseHeaders = new Set([
  "cache-control",
  "content-disposition",
  "content-type",
  "retry-after",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
]);

async function proxyRequest(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const backendPath = path.join("/");
  const collectionRouteNeedsSlash = ["notebooks", "vocab-items"].includes(
    backendPath,
  );
  const target = new URL(
    `/api/v1/${path
      .map((segment) => encodeURIComponent(segment))
      .join("/")}${collectionRouteNeedsSlash ? "/" : ""}`,
    backendUrl,
  );
  target.search = new URL(request.url).search;

  const rawContentLength = request.headers.get("content-length");
  if (rawContentLength && Number(rawContentLength) > maxRequestBodyBytes) {
    return Response.json({ detail: "Request body is too large" }, { status: 413 });
  }

  // Forward only application headers. Hop-by-hop headers from the browser
  // request (connection, transfer-encoding, content-length, etc.) can make
  // the server-side fetch fail when the request has a body.
  const headers = new Headers();
  for (const name of ["authorization", "content-type", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const body = bodylessMethods.has(request.method)
    ? undefined
    : await request.text();
  if (body && new TextEncoder().encode(body).byteLength > maxRequestBodyBytes) {
    return Response.json({ detail: "Request body is too large" }, { status: 413 });
  }

  try {
    let response = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    // FastAPI adds a trailing slash for collection routes. Replay the request
    // explicitly so POST/PUT bodies and the Authorization header survive.
    for (let attempt = 0; attempt < 2 && [307, 308].includes(response.status); attempt += 1) {
      const location = response.headers.get("location");
      if (!location) break;

      const redirectTarget = new URL(location, target);
      if (redirectTarget.origin !== target.origin) {
        return Response.json(
          { detail: "Backend returned an unsafe redirect" },
          { status: 502 },
        );
      }

      response = await fetch(redirectTarget, {
        method: request.method,
        headers,
        body,
        redirect: "manual",
      });
    }

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (forwardedResponseHeaders.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Backend proxy failed:", error);
    return Response.json(
      { detail: "Backend is unavailable. Start the FastAPI server and try again." },
      { status: 502 },
    );
  }
}

export const dynamic = "force-dynamic";

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
