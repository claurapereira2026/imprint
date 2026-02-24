# Imprint — SPEC.md

A self-hosted image generation API. Replaces BannerBear for AudioPen.

## What It Does

POST a title + body text + optional logo URL → receive an array of image URLs (portrait 2100×2800px cards).

Long content is auto-split into multiple cards (~500 words per card). Each card is rendered, saved to Vercel Blob, and its URL returned.

## API

### POST /api/generate

**Request body (JSON):**
```json
{
  "title": "My Post Title",
  "content": "Long form content goes here...",
  "logo": "https://example.com/logo.png"  // optional
}
```

**Response (JSON):**
```json
{
  "images": [
    "https://blob.vercel-storage.com/imprint/abc123-1.png",
    "https://blob.vercel-storage.com/imprint/abc123-2.png"
  ]
}
```

**Error response:**
```json
{ "error": "message" }
```

## Template Design

- **Canvas size:** 2100 × 2800px
- **Background:** dark navy `#3D4455`
- **Padding:** 120px all sides

### Layout (top to bottom):
1. **Logo** (if provided): 80×80px circle, top-left, with a white/light circular background pill
2. **Title:** Fraunces Bold (700), 96px, color `#FFFFFF`, line-height 1.15, letter-spacing -0.02em, max 3 lines, truncated with ellipsis if longer
3. **Content text:** DM Sans Regular (400), 56px, color `rgba(255,255,255,0.82)`, line-height 1.65, fills the remaining space
4. **Page indicator** (bottom right, if multiple pages): small text e.g. "1 / 3" in DM Sans, 40px, `rgba(255,255,255,0.45)`
5. **Author/brand pill** (bottom left): rounded pill badge, background `rgba(255,255,255,0.1)`, text `rgba(255,255,255,0.7)`, DM Sans 40px — reads "AudioPen" with a small orange dot `#E86830` to the left

### Accent color: `#E86830` (used for orange dot in author pill, any highlights)

## Text Splitting Logic

- Split `content` into chunks of ~500 words
- Each chunk becomes one card
- Title appears on every card
- Page indicator only shown when total pages > 1
- Preserve paragraph breaks when possible (split at paragraph boundaries near 500-word mark)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Image rendering:** `satori` library (HTML/CSS → SVG → PNG via `sharp`)
- **Storage:** `@vercel/blob` (stores generated PNGs, returns public URLs)
- **Fonts:** Load Fraunces + DM Sans as ArrayBuffers from Google Fonts at runtime (fetch once, cache in module scope)

## Implementation Details

### Font Loading

Fetch fonts at module level (outside the handler, cached):

```ts
let frauncesFontBold: ArrayBuffer | null = null;
let dmSansRegular: ArrayBuffer | null = null;

async function loadFonts() {
  if (!frauncesFontBold) {
    const res = await fetch('https://fonts.gstatic.com/s/fraunces/v24/6NUu8FyLNQOQZAnv9ZwNjucMHVn85Ni7emAe9lKqZTnDn-ahMRE.woff2');
    frauncesFontBold = await res.arrayBuffer();
  }
  if (!dmSansRegular) {
    const res = await fetch('https://fonts.gstatic.com/s/dmsans/v15/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTmf3ZGMZpg.woff2');
    dmSansRegular = await res.arrayBuffer();
  }
}
```

Note: The actual woff2 URLs above may not be exact — use a reliable Google Fonts CDN URL or fetch from the Google Fonts CSS2 API:
- Fraunces Bold 700: `https://fonts.googleapis.com/css2?family=Fraunces:wght@700&display=swap`
- DM Sans Regular 400: `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400&display=swap`

Parse the CSS to extract the `src: url(...)` for the `latin` subset, then fetch that woff2.

Alternatively, use a simpler approach: download the fonts as static files and place them in `public/fonts/`:
- `public/fonts/Fraunces-Bold.ttf` 
- `public/fonts/DMSans-Regular.ttf`

Then in the API route, read them with `fs.readFile` using `path.join(process.cwd(), 'public/fonts/...')`.

**Preferred approach: static files in public/fonts/** — more reliable than runtime fetching.

Download the fonts and include them in the project.

### Satori Usage

```ts
import satori from 'satori';
import sharp from 'sharp';

const svg = await satori(
  <div style={{ ... }}>...</div>,
  {
    width: 2100,
    height: 2800,
    fonts: [
      { name: 'Fraunces', data: frauncesFontBold, weight: 700, style: 'normal' },
      { name: 'DM Sans', data: dmSansRegular, weight: 400, style: 'normal' },
    ],
  }
);

const png = await sharp(Buffer.from(svg)).png().toBuffer();
```

### Vercel Blob Upload

```ts
import { put } from '@vercel/blob';

const blob = await put(`imprint/${Date.now()}-${pageIndex}.png`, png, {
  access: 'public',
  contentType: 'image/png',
});

return blob.url;
```

### Route Config

The API route must be a Node.js runtime (not Edge) because sharp requires Node:

```ts
export const runtime = 'nodejs';
export const maxDuration = 60; // allow up to 60 seconds for multi-page renders
```

## Environment Variables Required

```
BLOB_READ_WRITE_TOKEN=   # Vercel Blob token (set in Vercel dashboard)
```

## File Structure

```
imprint/
  app/
    api/
      generate/
        route.ts          ← Main API route
    page.tsx              ← Simple landing page / docs
    layout.tsx
    globals.css
  public/
    fonts/
      Fraunces-Bold.ttf   ← Downloaded font
      DMSans-Regular.ttf  ← Downloaded font
  SPEC.md
  package.json
```

## Landing Page (app/page.tsx)

Simple, minimal. No auth, no DB, no dashboard. Just:
- Product name "Imprint" + one-line description
- API endpoint docs (how to call POST /api/generate)
- Example request/response in code blocks
- Dark background matching the card template aesthetic

## Constraints

- No auth, no login, no dashboard
- No database
- All stateless
- Works on Vercel free tier
- Node.js runtime (not Edge) due to sharp dependency
