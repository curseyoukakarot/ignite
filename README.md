# IgniteGTM — Website

The IgniteGTM site: home of the AI INFRA SUMMIT, Ignite Studio, and GTM Advisory.
Static HTML/CSS/JS — no build step, no framework.

## Run locally

Any static server from the repo root works:

```bash
python3 -m http.server 4173
# then open http://localhost:4173
```

## Structure

| Path | What it is |
|---|---|
| `index.html` | Home page (hero video, ecosystem, events line-sheet, studio teaser, contact form) |
| `events.html` | Events — flagship summits, road-ahead timeline, activations |
| `studio.html` | Ignite Studio — four pillars, session portfolio (click-to-play), process, why us |
| `advisory.html` | GTM Advisory — full GTM motion, ICPs, engagement phases |
| `team.html` | The Core Five — credential-badge cards |
| `css/style.css` | Design system + home page styles |
| `css/pages.css` | Sub-page components (page heroes, detail rows, timelines, media sections) |
| `js/main.js` | Home page behaviors (hero video 13s loop, reveals, form, lightbox) |
| `js/page.js` | Shared sub-page behaviors (null-safe: reveals, counters, lightbox, nav) |
| `assets/` | Optimized images only (logos, posters, team headshots, section photos) |
| `IGNITE MATERIALS/` | Brand source files (wordmarks, bolt art, badge references) |

## Media pipeline (important)

**No video files in git.** All video streams from the Supabase `WS-assets` bucket.
Masters (ProRes `.mov`/`.m4v`) stay in the team archive. To publish a new video:

1. Encode for web: `ffmpeg -i master.mov -c:v libx264 -crf 22..25 -preset slow -movflags +faststart out.mp4` (add `-an` for muted background loops, `-t 60` to trim)
2. Upload to Supabase `WS-assets` — set `cacheControl: 31536000` if possible
3. Reference the public URL in the HTML

Images: optimize before committing (≤1920px, JPG q82-84). Team headshots are 640×640 B&W in `assets/team/`.

## Pre-launch checklist

- [ ] License Advisory hero image (Adobe Stock #700453557) and swap in full-res — currently a comp preview, marked `data-swap="licensed-image"`
- [ ] Swap placeholder partner logo text for real logo SVGs (`logo-bar`, `logo-wall` — see SWAP comments)
- [ ] Real DocSend URL on studio.html (2 links)
- [ ] Real LinkedIn/YouTube/X profile URLs (footer + team cards)
- [ ] Approved team bios (`data-swap="bio"`)
- [ ] Contact form backend (`js/main.js` TODO — currently client-side success state only)
- [ ] Re-upload Supabase videos with long cache headers (currently `no-cache`)
