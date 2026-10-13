const suspiciousUserAgentPatterns = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /python-urllib/i,
  /httpclient/i,
  /httpie/i,
  /libwww-perl/i,
  /mechanize/i,
  /scrapy/i,
  /selenium/i,
  /headlesschrome/i,
  /phantomjs/i,
  /playwright/i,
  /puppeteer/i,
  /node-fetch/i,
  /axios/i
];

const allowedPaths = new Set(['/health', '/api/health']);

const antiScrapingMiddleware = (req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');

  if (process.env.ANTI_SCRAPING_DISABLED === 'true' || allowedPaths.has(req.path)) {
    return next();
  }

  const userAgent = req.get('user-agent') || '';
  const blocked = !userAgent || suspiciousUserAgentPatterns.some((pattern) => pattern.test(userAgent));

  if (blocked) {
    return res.status(403).json({ message: 'Acces refuse.' });
  }

  next();
};

module.exports = antiScrapingMiddleware;
