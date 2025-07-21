export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // Extract path after /codex
    let path = url.pathname;
    if (path.startsWith('/codex')) {
      path = path.slice(6);
    }
    
    // Use fetch with a different approach to bypass IP restrictions
    const targetUrl = `http://89.19.222.90:8090${path}${url.search}`;
    
    try {
      // Create a new request with modified headers to bypass restrictions
      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers),
          'Host': '89.19.222.90:8090',
          'Origin': null,
          'Referer': null,
        },
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        redirect: 'follow'
      });
      
      // Use a different fetch approach
      const response = await fetch(proxyRequest, {
        cf: {
          // Cloudflare-specific options to bypass some restrictions
          resolveOverride: '89.19.222.90',
        }
      });
      
      // Create the response with proper CORS headers
      const responseHeaders = new Headers();
      
      // Copy essential headers from the original response
      for (const [key, value] of response.headers) {
        if (!key.toLowerCase().startsWith('cf-') && key.toLowerCase() !== 'server') {
          responseHeaders.set(key, value);
        }
      }
      
      // Add CORS headers
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', '*');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
      
    } catch (error) {
      console.error('Proxy error:', error);
      
      // Return a more helpful error response
      return new Response(JSON.stringify({
        error: 'Proxy failed',
        message: error.message,
        target: targetUrl,
        suggestion: 'Codex node may be unreachable or Cloudflare is blocking the IP'
      }), {
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }
  }
};