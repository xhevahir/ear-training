# Deploying

The app is a static site: `npm run build` writes everything to `dist/`. Installing it as an
app on a phone requires HTTPS, so it has to be served from an HTTPS host (`localhost` is fine
for development, but a phone on the LAN cannot install from `http://<ip>`).

## GitHub Pages (default)

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`: it installs dependencies, runs
   `npm run check` (typecheck, lint, tests), builds, and publishes `dist/`.
4. The site appears at `https://<user>.github.io/<repo>/`. The build uses relative paths
   (`base: './'`), so it works under that sub-path without changes.

## Installing on Android

1. Open the site in Chrome on the phone.
2. Chrome menu → **Add to Home screen** (or **Install app**).
3. Launch it from the new icon: it opens full-screen without browser chrome.
4. Open it once while online; after that it works offline (piano is cached immediately;
   other instruments are cached the first time they are used).

## Updates

A new version is downloaded in the background and takes effect the next time the app is
launched after all its windows are closed, so a running session is never interrupted.
Progress, settings and the practice log live in IndexedDB and are not affected by updates.

## Other hosts

Any static HTTPS host works (Netlify, Cloudflare Pages, a plain web server): publish the
contents of `dist/`. No server-side configuration is needed.

## Rebuilding samples

The instrument samples in `public/samples/` are committed. To regenerate them, see
`docs/attribution.md`.
