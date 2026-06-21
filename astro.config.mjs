import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://msvincognito.nl',
  integrations: [
    starlight({
      title: 'MSV Incognito',
      description: 'Study Association for the Department of Advanced Computing Sciences at Maastricht University',
      logo: {
        src: './src/assets/logo-white.svg',
        replacesTitle: true,
      },
      social: {
        linkedin: 'https://www.linkedin.com/company/msv-incognito/',
        instagram: 'https://www.instagram.com/msvincognito/',
      },
      customCss: [
        './src/styles/custom.css',
      ],
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
      },
      sidebar: [
        {
          label: 'Home',
          link: '/',
        },
        {
          label: 'About',
          link: '/about',
        },
        {
          label: 'Board',
          link: '/board',
        },
        {
          label: 'Committees',
          link: '/committees',
        },
        {
          label: 'Sponsors',
          items: [
            { label: 'Our Sponsors', link: '/sponsors' },
            { label: 'ASML', link: '/sponsors/asml' },
            { label: 'Computd', link: '/sponsors/computd' },
            { label: 'Boels Rental', link: '/sponsors/boels-rental' },
            { label: 'YER', link: '/sponsors/yer' },
            { label: 'ORTEC', link: '/sponsors/ortec' },
            { label: 'ESAOTE', link: '/sponsors/esaote' },
            { label: 'Medtronic', link: '/sponsors/medtronic' },
            { label: 'Startups', link: '/sponsors/startups' },
          ],
        },
        {
          label: 'Careers',
          items: [
            { label: 'Careers', link: '/careers' },
            { label: 'Job Listings', link: '/job-listings' },
          ],
        },
        {
          label: 'Contact',
          link: '/contact',
        },
        {
          label: 'Archive',
          items: [
            { label: 'Events', link: '/archive/events' },
            { label: 'History', link: '/archive/history' },
            { label: 'Members', link: '/archive/members' },
            { label: 'Posts', link: '/archive/posts' },
            { label: 'Yearbooks', link: '/archive/yearbooks' },
            { label: 'Store', link: '/archive/store' },
          ],
        },
        {
          label: 'Legal',
          items: [
            { label: 'Code of Conduct', link: '/code-of-conduct' },
            { label: 'Privacy Policy', link: '/privacy-policy' },
            { label: 'Terms & Conditions', link: '/terms-and-conditions' },
          ],
        },
      ],
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      pagination: true,
      lastUpdated: true,
      favicon: '/favicon.ico',
      head: [
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#000000' },
        },
      ],
      components: {
        // Override components here if needed
      },
    }),
  ],
});
