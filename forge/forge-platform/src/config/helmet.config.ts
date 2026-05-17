import helmet from 'helmet';

/**
 * Helmet configuration for production-grade security headers
 * Provides protection against common web vulnerabilities
 */
export const helmetConfig = helmet({
  /**
   * Content Security Policy: prevents XSS attacks
   * Restricts resources to trusted sources
   */
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:', 'wss:'],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
      childSrc: ["'self'"],
      objectSrc: ["'none'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined,
    },
    reportOnly: false,
    reportUri: process.env.CSP_REPORT_URI || undefined,
  },

  /**
   * Strict-Transport-Security: enforces HTTPS
   * Prevents man-in-the-middle attacks
   * max-age: 1 year in seconds (31536000)
   */
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  /**
   * X-Frame-Options: prevents clickjacking attacks
   * DENY: page cannot be displayed in a frame
   */
  frameguard: {
    action: 'deny',
  },

  /**
   * X-Content-Type-Options: prevents MIME-sniffing
   * nosniff: prevents browser from trying to guess MIME type
   */
  noSniff: true,

  /**
   * X-XSS-Protection: enables browser XSS filter
   * mode=block: block page if XSS attack detected
   */
  xssFilter: {
    mode: 'block',
  },

  /**
   * Referrer-Policy: controls referrer information
   * strict-no-referrer: no referrer sent
   */
  referrerPolicy: {
    policy: 'strict-no-referrer',
  },

  /**
   * Permissions-Policy: controls browser features
   * Restricts access to sensitive APIs
   */
  permissionsPolicy: {
    features: {
      geolocation: ["'self'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"],
      accelerometer: ["'none'"],
      ambient_light_sensor: ["'none'"],
      autoplay: ["'none'"],
      encrypted_media: ["'none'"],
      fullscreen: ["'self'"],
      gyroscope: ["'none'"],
      magnetometer: ["'none'"],
      microphone: ["'none'"],
      midi: ["'none'"],
      picture_in_picture: ["'self'"],
      sync_xhr: ["'self'"],
      usb: ["'none'"],
      vr: ["'none'"],
    },
  },

  /**
   * X-Powered-By: removes server info
   * Prevents information disclosure
   */
  hidePoweredBy: true,

  /**
   * Cross-Origin-Embedder-Policy: controls cross-origin embedding
   * require-corp: document requires Cross-Origin-Resource-Policy header
   */
  crossOriginEmbedderPolicy: {
    policy: 'require-corp',
  },

  /**
   * Cross-Origin-Opener-Policy: protects against Spectre attacks
   * same-origin-allow-popups: only same-origin or popups allowed
   */
  crossOriginOpenerPolicy: {
    policy: 'same-origin-allow-popups',
  },

  /**
   * Cross-Origin-Resource-Policy: controls cross-origin resource sharing
   * cross-origin: allows cross-origin requests
   */
  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },

  /**
   * Expect-CT: expects valid Certificate Transparency
   * enforce: reject connections without valid CT
   * max-age: 1 year (86400 seconds for testing, 31536000 for production)
   */
  expectCt: {
    enforce: process.env.NODE_ENV === 'production',
    maxAge: process.env.NODE_ENV === 'production' ? 31536000 : 86400,
    reportUri: process.env.EXPECT_CT_REPORT_URI || undefined,
  },

  /**
   * DNS Prefetch Control: disables DNS prefetching
   * prevent: don't prefetch hostnames
   */
  dnsPrefetchControl: {
    allow: false,
  },

  /**
   * IE No Open: IE specific header
   * noopen: prevents IE from opening downloads without user action
   */
  ieNoOpen: true,
});

/**
 * Certificate pinning configuration (optional, for high-security scenarios)
 * Pins specific certificates to prevent MITM attacks
 */
export const certificatePinningConfig = {
  keys: [
    // Add your certificate pins here
    // Format: base64-encoded SubjectPublicKeyInfo (SPKI)
  ],
  maxAge: 31536000, // 1 year
  sha256Pins: [
    // Add your SHA-256 pins here
    // Format: "sha256/base64-encoded-hash"
  ],
};

/**
 * Additional security headers not covered by Helmet
 * Apply these as custom middleware
 */
export const additionalSecurityHeaders = {
  'X-UA-Compatible': 'IE=edge', // IE compatibility mode
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
  'Vary': 'Accept-Encoding',
  'Server': 'Forge', // Replace with custom server name
};

/**
 * Middleware function to apply additional headers
 */
export const applyAdditionalHeaders = (req: any, res: any, next: any) => {
  Object.entries(additionalSecurityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
};

export default helmetConfig;
