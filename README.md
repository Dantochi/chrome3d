# Chrome3d

Course site for Chrome3d, an additive manufacturing company. Visitors browse and buy courses, watch the lessons on the site, and see the company's Instagram reels. Admins upload lesson videos and choose which are free and which sit behind the paywall.

Built with Next.js (App Router), Tailwind CSS, Supabase (accounts, database, private video storage) and Stripe Checkout.

## Run it

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

With no environment variables the site runs in **demo mode** on the sample catalogue in `src/content/courses.ts`: every page renders, but accounts, purchases, uploads and video playback are off.

## Connect the services

| Service | Variables | What it switches on |
|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Accounts, courses from the database, admin area, video upload and playback |
| Supabase service role | `SUPABASE_SERVICE_ROLE_KEY` | Lets the Stripe webhook record a purchase |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Paid checkout. Point a webhook for `checkout.session.completed` at `/api/webhooks/stripe` |
| Instagram | `INSTAGRAM_ACCESS_TOKEN`, `NEXT_PUBLIC_INSTAGRAM_HANDLE` | Real reels instead of sample cards |

Database setup: apply `supabase/migrations/0001_init.sql`, then `supabase/seed.sql` for the sample courses.

### Making someone an admin

Add their email to the `admin_emails` table **before** they sign up; the account is created as an admin. For an existing account, set `role = 'admin'` on their row in `profiles`.

## How access to videos works

Videos live in the private `course-videos` bucket at `<course id>/<lesson id>/<file>`. Nothing in that bucket is public. Database policies allow a visitor to read a video only when the lesson is free, they are enrolled in the course, or they are an admin; `/api/lessons/[id]/playback` then hands the player a short-lived signed URL. All hosting calls sit in `src/lib/video/`, so the host can be swapped for a streaming service later.

Supabase's free plan limits each file to 50 MB; larger videos need the Pro plan.

## Animations

- **Hero car** (`src/components/hero/`): one car drawn three ways. The blueprint draws itself on load; scrolling prints the chassis layer by layer, then wipes in the finished body.
- **Footer builder** (`src/components/footer/TetrisForge.tsx`): tetris pieces assemble ten objects, each turning into an isometric 3D outline. The silhouettes are in `src/lib/tetris/silhouettes.ts`; `npm run shapes` re-tiles them into tetris pieces and `npm test` checks every tiling is exact.

Both respect the reduced-motion system setting.

## Design references

`.mcp.json` registers the [Awwwards MCP](https://github.com/INSANE0777/Awwwards-mcp) so design research tools are available when working on this repo with an MCP-capable agent.
