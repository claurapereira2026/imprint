# Imprint

Self-hosted image card generation API. Replaces BannerBear.

**Live:** https://imprint-one.vercel.app

## Usage

```bash
curl -X POST https://imprint-one.vercel.app/api/generate \n  -H "Content-Type: application/json" \n  -d '{"title":"My Post","content":"Body text here..."}'
```

## Response

```json
{ "images": ["https://..."] }
```
