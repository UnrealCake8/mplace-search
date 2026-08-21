# MPlace Search

Safety-first, opt-in search for the MPlace ecosystem.

## What works now

- Public website submission
- Firestore-backed submission and crawl queues
- Bounded website crawler
- `robots.txt` checks and sitemap discovery
- Internal-link discovery
- Redirect and private-network protections
- `noindex` support
- HTML title, description, heading and text extraction
- Safety classification before a page becomes searchable
- Firestore-backed search index with basic relevance ranking
- Live search results from indexed pages
- Firebase-based MPlace ID foundation
- Protected crawler endpoint and Vercel daily cron

## Required environment variables

Copy `.env.example` and configure your Firebase web and Admin SDK values. In production also set a long random `CRAWLER_SECRET` and/or Vercel `CRON_SECRET`.

## Crawl flow

1. A visitor submits a public site at `/submit`.
2. The app creates a `siteSubmissions` document and a queued `crawlJobs` document.
3. `/api/crawl/run` consumes queued jobs.
4. The crawler checks the site, `robots.txt`, sitemap and internal links.
5. Allowed pages are extracted and safety-classified.
6. Only pages with `searchable: true` appear in MPlace Search.

For local testing, with `NODE_ENV` not set to production, you can call:

```bash
curl http://localhost:3000/api/crawl/run
```

In production, call the same endpoint with:

```bash
curl -H "Authorization: Bearer YOUR_CRAWLER_SECRET" https://YOUR_DOMAIN/api/crawl/run
```

The included Vercel cron runs once per day and processes one queued site, which stays compatible with Vercel Hobby cron limits. If MPlace needs faster crawling later, move the worker to a dedicated queue/worker service or trigger the protected endpoint from an external scheduler.

## Current MVP limits

The crawler intentionally caps work per site and only crawls the submitted hostname. Firestore is used as the first search index; if the index grows substantially, replace the candidate lookup with a dedicated search engine such as Typesense, Meilisearch or OpenSearch while keeping Firestore as the source of truth.
