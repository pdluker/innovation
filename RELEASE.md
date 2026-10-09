# Release: verified pool, fact-checked briefs, review queue

Built and tested locally on 2026-09-27 (offline self-test, plus end-to-end runs of the cron against mock APIs with local R2 and D1). **Nothing is deployed yet.** Each step below is safe to run on its own and can be undone.

> **Timing.** The live cron is `0 11 * * 3`, which Cloudflare reads as *Tuesday*. If step 1 is not done before **Tuesday Sep 29, 11:00 UTC**, that run uses the old code and the old, unverified pool.

## 1. Deploy the code

```bash
npm run check
npx wrangler deploy
```

The deploy output should list `schedule: 0 11 * * TUE,THU`. This ships the whole release. The database features (seeds, review queue, reactions) stay off until step 3, and the Worker keeps running on the bundled pool until then.

Try the new pipeline on the real API without publishing anything. This runs the brief, fact-check and kit, with no audio and no writes:

```bash
curl.exe -s -X POST "https://innovation.stluker.com/refresh?dryRun=1&idea=spec-to-takeoff" -H "Authorization: Bearer YOUR_REFRESH_SECRET"
```

Look at `factCheck.rounds`: this idea's old sourcing produced the fabricated CFMA citation.

## 2. Migrate the archive

This gives the 11 published episodes measured durations, Score v2, their sources and correction notes. The audio and transcripts are not touched.

```bash
node scripts/backfill-archive.mjs            # dry run - prints every change
node scripts/backfill-archive.mjs --apply    # backs up originals to R2 backup/2026-09-27/, then writes
```

## 3. Turn on the idea database

```bash
npx wrangler d1 create innovation-daily
```

Paste the printed `database_id` into `wrangler.jsonc` and uncomment the `d1_databases` block. Then:

```bash
npx wrangler d1 migrations apply innovation-daily --remote
node scripts/seed-d1.mjs
npx wrangler d1 execute innovation-daily --remote --file=.backfill/seed-pool.sql
npx wrangler deploy
```

Seeding is idempotent: re-running it never overwrites a status you changed. After editing `ideas-source.js` or `verification.js` in git, push the edits with `node scripts/seed-d1.mjs --update-editorial`. This refreshes content but never changes a row's status.

## 4. Turn on the owner email

```bash
npx wrangler secret put RESEND_API_KEY    # the same Resend account stl-dispatcher uses; stluker.com is already verified
npx wrangler secret put NOTIFY_EMAIL      # where the publish email should go
```

After every scheduled run you get an email with:

- the brief, and one-tap links to record your pursue, watch or pass;
- approve and hold links for waiting ideas;
- an "add an idea" link.

Links only act after you tap Confirm, so mail scanners can't trigger them.

## 5. Keep the dispatcher's drift check in step

In `stl-dispatcher/reconcile.js`, change:

```js
{ worker: "innovation-daily", expected: "0 11 * * 2,4" },   // Tue/Thu 06:00 CT
```

to:

```js
{ worker: "innovation-daily", expected: "0 11 * * TUE,THU" }, // Tue/Thu 06:00 CT
```

Then deploy the dispatcher. Otherwise the daily drift alert fires after step 1.

The same numbering trap applies to `rails-beneath-us`: its `0 11 * * 1,3,5` means Sun/Tue/Thu on Cloudflare, not Mon/Wed/Fri.

## 6. Check it

- `curl.exe -s https://innovation.stluker.com/status -H "Authorization: Bearer YOUR_REFRESH_SECRET"`: expect `poolSize` 28 and five entries under `notSelectable`.
- Open `/method.html`, then the 2026-09-02 episode. Its correction note is at the top of the full edition, and its sources sit under "Sources".
- Add validation kits to the older episodes now, instead of 3 per scheduled run:
  `curl.exe -s -X POST "https://innovation.stluker.com/api/admin/backfill-kits?limit=11" -H "Authorization: Bearer YOUR_REFRESH_SECRET"`
- After step 3, open `/admin.html` and sign in with `REFRESH_SECRET`.

## Rollback

- Code: `npx wrangler rollback` restores the previous version, which is listed in `npx wrangler deployments list`.
- Archive: originals are in R2 under `backup/2026-09-27/episodes/`, and locally in `.backfill/original/`.

## Decisions only the owner can make

1. **Two held ideas.** `estate-inventory` makes a probate licensing claim, and `trade-school-admissions` gives Title IV pricing guidance. The open items and suggested wording are in `npm run report:pool`.
2. **Three new drafts, needing review.** Two are buy-type: an AI-enabled bookkeeping practice and a property management firm. The third is a consumer appeal app. Approve them in `/admin.html` after step 3, or leave them.
3. ~~**Episode length.**~~ Done 2026-10-09. The 540-720 budget actually produced 3:14-3:43 episodes, because the model writes under its section ranges. The budget is now 800-940 words (ceiling 1000), with the spoken sections raised about 40 percent, aiming at 5 minutes; the feed says "five-minute". Check the measured duration of the first run and adjust `script.js` if needed.
4. Swap the master doc into the claude.ai project's knowledge (plan item P0 #4).
5. AI News Daily: deploy it or shelve it.
