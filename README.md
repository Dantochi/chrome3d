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

- **Hero engine** (`src/components/hero/`): one turbofan engine drawn three ways. The blueprint draws itself on load; scrolling prints the core (fan, compressor, combustor, turbines, shaft) layer by layer, then wipes in the finished chrome nacelle.
- **Footer builder** (`src/components/footer/TetrisForge.tsx`): tetris pieces assemble ten real objects (wrench, gear, cordless drill, sneaker, drone, 3D printer, robot arm, propeller, helmet, car). Each blocky build relaxes into the object's smooth outline, then turns to an isometric view and gains depth.

To change the footer objects, edit the vector outlines in `src/lib/tetris/outlines.ts` and run `npm run shapes`. That rasterises each outline to blocks, tiles the blocks exactly with tetris pieces and works out the visible isometric lines; `npm test` checks every tiling.

Both animations respect the reduced-motion system setting.

### Credits

The footer outlines come from [Material Design Icons](https://pictogrammers.com/library/mdi/) and, for the drill, [Material Symbols](https://fonts.google.com/icons), both under the Apache License 2.0.

## Design references

`.mcp.json` registers the [Awwwards MCP](https://github.com/INSANE0777/Awwwards-mcp) so design research tools are available when working on this repo with an MCP-capable agent.
