# System Snacks

A beginner-friendly system design learning app: 24 short lessons in six decks, two questions per lesson, bookmarks, and spaced review. React, TypeScript, and Vinext, exported as a static website. Progress stays in browser local storage; there are no accounts or server APIs.

- Live: https://jayeshkarande1.github.io/system-snacks/
- Source: https://github.com/JayeshKarande1/system-snacks

## Run and verify

Use Node 22.13 or newer and npm.

```sh
npm ci
npm run dev
npm test
npx tsc --noEmit
npm run build
npm start
```

Development uses port 5173. The production preview is http://127.0.0.1:4173/system-snacks/. `npm run build` exports to `dist/client`, flattens the generated asset directory, checks every HTML asset reference, and adds `.nojekyll`. These steps are required for GitHub Pages and must not be skipped.

## Publish to GitHub Pages

After verifying the production preview:

```sh
git add app scripts package.json package-lock.json README.md next.config.ts
git add -f dist/client
git commit -m "Update System Snacks"
git push origin main
git subtree split --prefix dist/client
# Copy the returned commit SHA into the next command:
git push origin <returned-commit-sha>:gh-pages
```

Pages publishes the root of `gh-pages`. Wait for the GitHub Pages workflow to succeed, then verify the live app in a browser, including a lesson and its questions. An HTTP 200 response alone does not prove the app has loaded. Generated files are tracked for the existing branch publication flow; always rebuild them before publishing.

## Learning behavior

- Choose Normal for the clean light interface or Gaming for dark surfaces and neon accents. The appearance switch is available in every view and saves its preference on this device, separately from learning progress.

- Answering both questions correctly marks a lesson Practiced; retries have no penalty.
- Initial review is tomorrow. Remembered advances through 3, 7, then 14 days; Again resets to tomorrow.
- Completed lessons remain available for extra review when no cards are due.
- Repeating a completed quiz preserves its existing review date.
- Clearing browser data clears progress. Localhost and the live site store separate progress.
- Saved state uses the versioned `system-snacks:v1` key. Corrupt state produces a visible recovery notice; unavailable storage leaves the app usable without persistence.

## Curriculum references

The explanations use original wording and illustrative examples. Supporting technical references:

- MDN: https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview
- PostgreSQL indexes: https://www.postgresql.org/docs/current/indexes.html
- PostgreSQL replication: https://www.postgresql.org/docs/current/high-availability.html
- Redis cache-aside: https://redis.io/docs/latest/develop/use-cases/cache-aside/
- Redis eviction: https://redis.io/docs/latest/develop/reference/eviction/
- AWS retries: https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html

## Verification

`npm test` checks the complete lesson catalog, reading lengths, questions, persistence parsing, duplicate completion, review intervals, and calendar boundaries. Use the production preview to verify desktop/mobile layout, keyboard navigation, answering and retrying questions, saved cards, reload persistence, and review reveal/rating. Reduced-motion preferences disable decorative transitions.
