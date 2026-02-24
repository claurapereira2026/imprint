export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <main className="w-full max-w-2xl px-8 py-24">
        <h1 className="text-5xl font-bold tracking-tight mb-4">Imprint</h1>
        <p className="text-lg text-white/60 mb-16">
          Image generation API — turn text content into beautiful image cards.
        </p>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-white/90">
            POST /api/generate
          </h2>
          <p className="text-white/60 mb-6">
            Send a title, content, and optional logo URL. Receive an array of
            generated image URLs. Long content is automatically split into
            multiple 2100&times;2800px cards.
          </p>

          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-3">
            Request
          </h3>
          <pre className="bg-black/30 rounded-xl p-6 text-sm leading-relaxed text-white/80 overflow-x-auto mb-8 font-mono">
{`POST /api/generate
Content-Type: application/json

{
  "title": "My Post Title",
  "content": "Long form content goes here...",
  "logo": "https://example.com/logo.png"
}`}
          </pre>

          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-3">
            Response
          </h3>
          <pre className="bg-black/30 rounded-xl p-6 text-sm leading-relaxed text-white/80 overflow-x-auto font-mono">
{`{
  "images": [
    "https://blob.vercel-storage.com/imprint/abc123-0.png",
    "https://blob.vercel-storage.com/imprint/abc123-1.png"
  ]
}`}
          </pre>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-white/90">Fields</h2>
          <div className="space-y-3 text-white/60 text-sm">
            <p>
              <code className="text-white/80 font-mono bg-black/20 px-2 py-1 rounded">title</code>{" "}
              <span className="text-white/40">string, required</span> — Displayed at the top of every card.
            </p>
            <p>
              <code className="text-white/80 font-mono bg-black/20 px-2 py-1 rounded">content</code>{" "}
              <span className="text-white/40">string, required</span> — Body text, auto-split into ~500-word chunks.
            </p>
            <p>
              <code className="text-white/80 font-mono bg-black/20 px-2 py-1 rounded">logo</code>{" "}
              <span className="text-white/40">string, optional</span> — URL to a logo image shown as a circle.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
