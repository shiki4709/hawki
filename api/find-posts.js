const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { keywords, timeframe } = req.body || {};
  if (!keywords || !keywords.trim()) return res.status(400).json({ error: 'No keywords provided' });

  let timeFilter = '';
  if (timeframe === 'week') timeFilter = '&tf=pw';
  else if (timeframe === 'month') timeFilter = '&tf=pm';
  else if (timeframe === 'year') timeFilter = '&tf=py';

  const query = `site:linkedin.com/posts/ ${keywords.trim()}`;
  const searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}${timeFilter}`;

  let html;
  try {
    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      timeout: 15000,
    });
    html = await resp.text();
  } catch (e) {
    return res.status(500).json({ error: 'Search request failed: ' + e.message });
  }

  // Decode HTML entities
  html = html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

  // Extract LinkedIn post URLs
  const urlMatches = html.match(/linkedin\.com\/posts\/([^\s"<>]+activity-\d+[^\s"<>]*)/g) || [];
  const urls = urlMatches.map(u => 'https://www.' + u);

  // Extract snippets and titles from Brave results
  const snippetMatches = html.match(/<p class="snippet-description[^"]*"[^>]*>([\s\S]*?)<\/p>/g) || [];
  const snippets = snippetMatches.map(s => s.replace(/<[^>]+>/g, '').trim());

  const titleMatches = html.match(/<span class="snippet-title"[^>]*>([\s\S]*?)<\/span>/g) || [];
  const titles = titleMatches.map(t => t.replace(/<[^>]+>/g, '').trim());

  // Deduplicate and build results
  const seen = new Set();
  const posts = [];
  let snippetIdx = 0;

  for (const url of urls) {
    const clean = url.replace(/[?&](utm_\w+|trk|rcm)=[^&]*/g, '').replace(/[&?]$/, '');
    const actMatch = clean.match(/activity-(\d+)/);
    if (!actMatch || seen.has(actMatch[1])) continue;
    seen.add(actMatch[1]);

    const snippet = snippetIdx < snippets.length ? snippets[snippetIdx++] : '';

    const postMatch = clean.match(/linkedin\.com\/posts\/([^_]+)_(.+?)(?:-activity|-\d)/);
    const author = postMatch ? postMatch[1].replace(/-/g, ' ') : '';
    const searchTitle = posts.length < titles.length ? titles[posts.length] : '';
    const title = searchTitle || (postMatch ? postMatch[2].replace(/-/g, ' ') : '');

    posts.push({
      url: clean,
      author,
      title: title.substring(0, 120),
      snippet: snippet.substring(0, 200),
      activity_id: actMatch[1],
    });
  }

  res.json({ posts, query: keywords.trim() });
};
