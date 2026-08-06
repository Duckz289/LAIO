const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:8001";

const bodylessMethods = new Set(["GET", "HEAD"]);

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

      response = await fetch(new URL(location, target), {
        method: request.method,
        headers,
        body,
        redirect: "manual",
      });
    }

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (key !== "content-encoding" && key !== "content-length") {
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
      {
        detail:
          process.env.NODE_ENV === "production"
            ? "Backend is unavailable. Start the FastAPI server and try again."
            : error instanceof Error
              ? error.message
              : String(error),
      },
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
