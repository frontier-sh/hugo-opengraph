# hugo-opengraph

Automatic OG images for Hugo, written by Claude 3.7 Sonnet and [Frontier.sh](https://frontier.sh/).

## Usage

You can implement the `./scripts/og-generator` directory into your own standard Hugo installation, with some minor modifications. You'll want to reference the `./layouts/partials/extended_head.html` partial to include these OpenGraph images (and other tags).

Customise the design by editing `./scripts/og-generator/generate.js` to reflect your site's style, name, etc.

If building on Cloudflare Pages, set the build command to `./bin/cloudflare-build` to have it automatically generate the images on deployment.