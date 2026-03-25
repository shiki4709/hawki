# How to export LinkedIn cookies

## Quick method (Chrome/Arc)

1. Go to linkedin.com and make sure you're logged in
2. Open DevTools: Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows)
3. Go to Console tab
4. Paste this and hit Enter:

```javascript
copy(JSON.stringify(document.cookie.split('; ').reduce((acc, c) => { const [n, ...v] = c.split('='); acc[n] = v.join('='); return acc; }, {}), null, 2))
```

5. Open a text editor, paste (Cmd+V), and save as `cookies.json` in the `server/` folder

## What the file should look like

```json
{
  "li_at": "AQEDAx...",
  "JSESSIONID": "ajax:...",
  "bcookie": "...",
  ...
}
```

The most important cookie is `li_at` — that's your session token.
