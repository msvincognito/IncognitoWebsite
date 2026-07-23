import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: 'https://msvincognito.nl',
  integrations: [mdx()],
  adapter: cloudflare()
});