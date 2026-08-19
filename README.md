# MVP1 Ventures — website

Static marketing site for MVP1 Ventures. No build step, no framework, no CMS —
plain HTML, one stylesheet and a few small progressive-enhancement scripts.
It is fully self-contained and carries **no dependency on the legacy WordPress site**.

## Running it locally

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>. Any static file server works.

## Deploying to GitHub Pages

1. Push this directory to the repository root on the `main` branch.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. `.github/workflows/deploy.yml` publishes on every push to `main`.

For a custom domain, add a `CNAME` file at the repo root containing `mvp1.com.au`
(no protocol, no trailing slash), then set the domain under Settings → Pages and
point the DNS at GitHub. `.nojekyll` is already present so Jekyll never processes
the files.

## Structure

```
index.html, about-us.html, …    top-level pages
blog/                           16 articles
podcast/                        7 episode pages
case-studies/                   3 case studies
resources/                      workbook landing page
assets/
  site.css                      the whole design system
  site.js                       nav, mobile menu, scroll reveal
  contact-form.js               contact + workbook form handling
  assessment.js                 AI readiness assessment (runs client-side)
  content.js                    resource index data
  resources.js                  resource list rendering + filters
  img/                          case study imagery
404.html, robots.txt, sitemap.xml
```

## Before launch — two things need a human

1. **Form endpoint.** `assets/contact-form.js` has `MVP1_FORM_ENDPOINT = ''`.
   Set it to your Formspree/Basin/handler URL and update the matching `action`
   on the forms in `contact.html` and `resources/business-model-workbook.html`.
   Until then the forms fall back to opening the visitor's mail client.
2. **Legal review.** `privacy-policy.html` and `terms-conditions.html` reproduce
   the structure and substance of the published policies but have not been
   verified by a lawyer. Both carry `noindex` and an on-page notice. Search for
   `LEGAL-REVIEW`, have them confirmed, then remove the notice and the robots tag.

## Background video

Two looping clips sit behind sections on the homepage: the network animation
across the hero, and the particle stream behind the closing CTA. Both are in
`assets/video/` as MP4 + WebM with a JPEG poster.

How they behave:

- **Nothing loads until the section is on screen.** Sources live in `data-src`
  and are attached by `site.js`, so a visitor who never scrolls to the CTA never
  downloads its video.
- **Reduced motion means no video at all** — not a paused one. The guard skips
  the whole block, so the sources are never set and the poster frame stands in.
- They pause when scrolled away and when the tab is hidden.
- Audio is stripped at encode time; they are `muted loop playsinline`,
  `aria-hidden` and out of the tab order.

Adding another: give the `<video>` `class="js-bgvideo"`, put the URLs in
`data-src`, set a `poster`, and pair it with a scrim element. **Check contrast
across the whole loop, not one frame** — the hero's body copy measured 6.8:1 on
a still and 3.9:1 at its worst moment, which is a fail.

Re-encoding a source clip (seamless loop via crossfade, audio stripped):

```bash
ffmpeg -i in.mp4 -filter_complex "[0:v]split=3[a][b][c];[a]trim=0:1.3,setpts=PTS-STARTPTS[h];[b]trim=3.79:5.09,setpts=PTS-STARTPTS[t];[t][h]blend=all_expr='A*(1-(T/1.3))+B*(T/1.3)'[m];[c]trim=1.3:3.79,setpts=PTS-STARTPTS[r];[m][r]concat=n=2:v=1:a=0[v]" -map "[v]" -an -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart out.mp4
```

## Conventions

- **Spacing** comes from the `--s-*` scale and `.mt-*` utilities. Avoid inline styles.
- **Motion** uses the `--ease-*` and `--t-*` tokens; keep UI transitions under 300ms.
- **Every interactive element** must have a visible `:focus-visible` state — the
  base rule in `site.css` covers this, so do not override it away.
- **Hover effects** belong inside the `@media (hover:hover) and (pointer:fine)` block.
- **Infinite animations** must be switched off under `prefers-reduced-motion`, not
  merely shortened.
- Adding a resource? Add a row to `assets/content.js` and create the page.
  Add the URL to `sitemap.xml`.
