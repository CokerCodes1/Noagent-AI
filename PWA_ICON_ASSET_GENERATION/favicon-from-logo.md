# Favicon assets update plan (logo.webp -> favicon)

This repo currently uses static favicon assets under `frontend/public/`:

- `favicon.svg`
- `favicon-16.png`
- `favicon-32.png`
- `favicon-48.png` (if used by the browser)

Your request was to change the favicon from the Vite logo to the brand logo.

## Done

- Fixed `frontend/public/sw.js` caching crash for `Cache.put` when the response status is `206`.

## Remaining

To fully swap favicon visuals, the following assets must be regenerated from `frontend/public/logo.webp`:

- `frontend/public/favicon.svg`
- `frontend/public/favicon-16.png`
- `frontend/public/favicon-32.png`
- `frontend/public/favicon-48.png`

Because this environment tool cannot directly convert/resize `.webp` into `.png/.svg` files, regeneration should be done via an external tool or by running a script locally (ImageMagick or sharp).
