export async function onRequest(context) {
    const response = await context.next();
    const url = new URL(context.request.url);

    // If served from Cloudflare's *.pages.dev domain, instruct search engines
    // NOT to index the preview/dev domain to prevent duplicate content with hackerfeel.com
    if (url.hostname.endsWith('.pages.dev')) {
        const headers = new Headers(response.headers);
        headers.set('X-Robots-Tag', 'noindex, nofollow');
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    }

    return response;
}
