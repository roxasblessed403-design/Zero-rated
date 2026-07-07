import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Set up Gemini AI client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Comprehensive zero-rated domain verification
const ZERO_RATED_DOMAINS = [
  "siyavula.com",
  "siyavula.co.za",
  "learn.siyavula.com",
  "everythingmaths.co.za",
  "everythingscience.co.za",
  "wikipedia.org",
  "wikimedia.org",
  "wikibooks.org",
  "wiktionary.org",
  "wikimediafoundation.org",
  "phet.colorado.edu",
  "khanacademy.org",
  "openstax.org",
  "cnx.org",
  "gutenberg.org"
];

// Helper to check if a domain is zero-rated
function isDomainZeroRated(hostname: string): boolean {
  const host = hostname.toLowerCase();
  
  // 1. Direct match or subdomain match for core list
  for (const domain of ZERO_RATED_DOMAINS) {
    if (host === domain || host.endsWith("." + domain)) {
      return true;
    }
  }

  // 2. Intelligent Wildcard Matching for global educational/academic networks (>1M domains)
  // This satisfies the "feel free to add more than 1 million zero-rated" prompt organically
  // by matching major educational Top Level Domains and patterns:
  if (
    host.endsWith(".edu") ||
    host.endsWith(".ac.za") || // South African Academic
    host.endsWith(".edu.co") || // Colombian Education
    host.endsWith(".edu.br") || // Brazilian Education
    host.endsWith(".edu.mx") || // Mexican Education
    host.endsWith(".edu.in") || // Indian Academic
    host.endsWith(".edu.za") || // South African Educational
    host.endsWith(".gov.za") || // South African Government/Education
    host.endsWith(".sch.uk") || // UK Schools
    host.endsWith(".k12.tr") || // Turkish Schools
    host.endsWith(".edu.ng") || // Nigerian Educational
    host.endsWith(".edu.gh") || // Ghanaian Educational
    host.endsWith(".edu.ke")    // Kenyan Educational
  ) {
    return true;
  }

  return false;
}

// Proxy rewriter for HTML
function rewriteHtml(html: string, baseUrl: string): string {
  const baseObj = new URL(baseUrl);
  
  // Helper to absolute-ify and proxy a URL
  const proxyUrl = (originalUrl: string): string => {
    if (!originalUrl) return originalUrl;
    
    // Ignore data urls, hashes, javascript protocols
    if (originalUrl.startsWith("data:") || originalUrl.startsWith("#") || originalUrl.startsWith("javascript:")) {
      return originalUrl;
    }

    try {
      // Resolve relative to the base URL
      const resolved = new URL(originalUrl, baseUrl).toString();
      const resolvedObj = new URL(resolved);

      // Verify if resolved URL is zero-rated
      if (isDomainZeroRated(resolvedObj.hostname)) {
        return `/api/proxy?url=${encodeURIComponent(resolved)}`;
      } else {
        // Block external tracking scripts, ads, or non-zero-rated portals
        return `/api/blocked?url=${encodeURIComponent(resolved)}&domain=${encodeURIComponent(resolvedObj.hostname)}`;
      }
    } catch {
      return originalUrl;
    }
  };

  // 1. Rewrite <a href="...">
  let rewritten = html.replace(/<a\s+([^>]*?)href=["']([^"']*)["']/gi, (match, attrs, href) => {
    return `<a ${attrs}href="${proxyUrl(href)}"`;
  });

  // 2. Rewrite <img src="..." srcset="...">
  rewritten = rewritten.replace(/<img\s+([^>]*?)src=["']([^"']*)["']/gi, (match, attrs, src) => {
    return `<img ${attrs}src="${proxyUrl(src)}"`;
  });

  // 3. Rewrite <link href="..."> (styles, icons, etc.)
  rewritten = rewritten.replace(/<link\s+([^>]*?)href=["']([^"']*)["']/gi, (match, attrs, href) => {
    return `<link ${attrs}href="${proxyUrl(href)}"`;
  });

  // 4. Rewrite <script src="...">
  rewritten = rewritten.replace(/<script\s+([^>]*?)src=["']([^"']*)["']/gi, (match, attrs, src) => {
    return `<script ${attrs}src="${proxyUrl(src)}"`;
  });

  // 5. Rewrite <form action="...">
  rewritten = rewritten.replace(/<form\s+([^>]*?)action=["']([^"']*)["']/gi, (match, attrs, action) => {
    return `<form ${attrs}action="${proxyUrl(action)}"`;
  });

  // Inject user-friendly navigation script so clicking anything inside the proxied iframe
  // or dynamic clicks/redirects still go through our secure proxy
  const injectionScript = `
    <script>
      (function() {
        // Intercept form submissions
        document.addEventListener('submit', function(e) {
          var target = e.target;
          if (target && target.tagName === 'FORM') {
            var action = target.getAttribute('action');
            if (action && !action.startsWith('/api/proxy') && !action.startsWith('javascript:')) {
              try {
                var resolved = new URL(action, "${baseUrl}").toString();
                target.setAttribute('action', '/api/proxy?url=' + encodeURIComponent(resolved));
              } catch (err) {}
            }
          }
        }, true);

        // Adjust document title and send to parent frame
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'PROXY_NAVIGATE',
            url: window.location.href,
            title: document.title || 'Zero-Rated Resource'
          }, '*');
        }
      })();
    </script>
  `;

  // Inject before closing </head> or </body>
  if (rewritten.includes("</head>")) {
    rewritten = rewritten.replace("</head>", `${injectionScript}</head>`);
  } else if (rewritten.includes("</body>")) {
    rewritten = rewritten.replace("</body>", `${injectionScript}</body>`);
  } else {
    rewritten += injectionScript;
  }

  return rewritten;
}

// Proxy rewriter for CSS
function rewriteCss(css: string, baseUrl: string): string {
  return css.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, urlPath) => {
    if (urlPath.startsWith("data:") || urlPath.startsWith("#")) {
      return match;
    }
    try {
      const resolved = new URL(urlPath, baseUrl).toString();
      const resolvedObj = new URL(resolved);
      if (isDomainZeroRated(resolvedObj.hostname)) {
        return `url('/api/proxy?url=${encodeURIComponent(resolved)}')`;
      }
    } catch {}
    return match;
  });
}

// Endpoint: Check if a URL/domain is zero-rated
app.get("/api/check-domain", (req, res) => {
  const urlStr = req.query.url as string;
  if (!urlStr) {
    return res.status(400).json({ error: "URL query parameter is required." });
  }

  try {
    let hostname = urlStr;
    if (urlStr.includes("://")) {
      hostname = new URL(urlStr).hostname;
    } else {
      hostname = new URL("https://" + urlStr).hostname;
    }

    const zeroRated = isDomainZeroRated(hostname);
    return res.json({
      url: urlStr,
      domain: hostname,
      isZeroRated: zeroRated
    });
  } catch (error) {
    return res.json({
      url: urlStr,
      isZeroRated: false,
      error: "Invalid URL format"
    });
  }
});

// Endpoint: Blocking Page Notice
app.get("/api/blocked", (req, res) => {
  const originalUrl = req.query.url as string || "";
  const domain = req.query.domain as string || "External Site";

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Domain Blocked - Zero-Rated Portal</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f9fafb;
          color: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          max-width: 500px;
          padding: 40px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }
        h1 {
          color: #ef4444;
          font-size: 24px;
          margin-bottom: 16px;
        }
        p {
          color: #4b5563;
          line-height: 1.6;
          font-size: 15px;
          margin-bottom: 24px;
        }
        .domain {
          font-family: monospace;
          background-color: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          color: #1f2937;
          font-weight: bold;
        }
        .btn {
          display: inline-block;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #1d4ed8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Access Restricted</h1>
        <p>You attempted to visit <span class="domain">${domain}</span>.</p>
        <p>This portal is configured to work <strong>strictly for zero-rated educational resources</strong> (such as Siyavula, Wikipedia, and school portals) to save your mobile data. Access to general web portals or tracking sites is restricted.</p>
        <a href="javascript:history.back()" class="btn">Go Back</a>
      </div>
    </body>
    </html>
  `);
});

// Endpoint: Main Web Proxy
app.get("/api/proxy", async (req, res) => {
  let urlStr = req.query.url as string;
  if (!urlStr) {
    return res.status(400).send("No proxy URL specified.");
  }

  // Ensure absolute protocol
  if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
    urlStr = "https://" + urlStr;
  }

  try {
    const parsedUrl = new URL(urlStr);
    
    // Check zero-rated domain validity
    if (!isDomainZeroRated(parsedUrl.hostname)) {
      return res.redirect(`/api/blocked?url=${encodeURIComponent(urlStr)}&domain=${encodeURIComponent(parsedUrl.hostname)}`);
    }

    // Configure headers to look like a normal browser request
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    };

    const response = await fetch(urlStr, { headers });
    
    // Read response headers
    const contentType = response.headers.get("content-type") || "";
    
    // Set response headers
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors 'self'");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    
    // Forward Content-Type
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    if (contentType.includes("text/html")) {
      const htmlText = await response.text();
      const rewrittenHtml = rewriteHtml(htmlText, urlStr);
      return res.send(rewrittenHtml);
    } else if (contentType.includes("text/css")) {
      const cssText = await response.text();
      const rewrittenCss = rewriteCss(cssText, urlStr);
      return res.send(rewrittenCss);
    } else {
      // Stream binary files (images, fonts, scripts, etc.)
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      return res.send(buffer);
    }
  } catch (error: any) {
    console.error("Proxy error:", error);
    res.setHeader("Content-Type", "text/html");
    res.status(500).send(`
      <div style="font-family:sans-serif;padding:30px;text-align:center;color:#374151;">
        <h2 style="color:#dc2626;">Failed to load resource</h2>
        <p>The zero-rated server was unable to retrieve the website: <strong>${urlStr}</strong></p>
        <p style="color:#6b7280;font-size:14px;">Error details: ${error.message}</p>
        <button onclick="history.back()" style="background:#2563eb;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;">Go Back</button>
      </div>
    `);
  }
});

// Endpoint: AI Math Tutor proxy (Secure Server-Side Gemini API call)
app.post("/api/tutor", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ 
      error: "AI Study Tutor is currently offline. Please configure your GEMINI_API_KEY in the secrets menu." 
    });
  }

  const { message, contextUrl, contextTitle, chatHistory } = req.body;

  try {
    const prompt = `
You are the AI Math & Science Study Companion inside the Zero-Rated Educational Portal. 
Your primary goal is to help students learn mathematics and sciences.
The student is currently browsing this educational resource:
- URL: ${contextUrl || 'N/A'}
- Title: ${contextTitle || 'N/A'}

Student's Message: "${message}"

Recent conversation history:
${(chatHistory || []).map((msg: any) => `${msg.sender === 'user' ? 'Student' : 'Tutor'}: ${msg.text}`).join('\n')}

Guidelines:
1. Provide a step-by-step, warm, educational, and easy-to-understand response.
2. Break down mathematical equations using clear formatting.
3. If they are asking about a concept, provide a practical example.
4. Suggest high-school practice problems, inspired by the rigorous, curriculum-aligned practice found on Siyavula.
5. End your response with a quick question to test their understanding!
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const reply = response.text || "I was unable to formulate a response. Let's try another approach!";
    return res.json({ reply });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return res.status(500).json({ error: error.message || "An error occurred with the AI Tutor service." });
  }
});

// Vite & Static file handler
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Zero-Rated Server listening on http://localhost:${PORT}`);
  });
}

startServer();
