# How to Update Photos on Your Website

Every photo on your site now lives in one folder: `assets/img/photos/`.

**To swap a photo, just replace the file** — keep the exact same file name, and
the new photo will show up everywhere the old one did. No code, no editing
HTML, nothing else to touch.

For best results, use a similarly-shaped photo (landscape photos for landscape
spots, tall/portrait photos for tall spots) and keep the file reasonably sized
— under 2–3 MB is plenty; huge camera-original files will make your site slow
to load. JPG format is best for real photos.

## What each file is and where it shows up

Several photos are reused across multiple pages on purpose, for a consistent
look — replacing one file updates every page it appears on at once.

| File name | Where it appears |
|---|---|
| `hero-main.jpg` | The big photo at the very top of the Home page |
| `worship-hands-raised.jpg` | Watch page header photo |
| `congregation-worship.jpg` | About page, and several ministry pages (Kids, Missions, Women's, Watch, Worship, Visit) |
| `church-exterior.jpg` | The building/cross photo — used widely (About, Home "Visit Us", and most ministry pages) |
| `bible-closeup.jpg` | Open Bible close-up — used on several ministry pages (Men's, Kids, Small Groups, Prayer, Programs) |
| `small-group-study.jpg` | Small group Bible study photo — Contact, Programs, Small Groups, Home, Women's |
| `worship-band.jpg` | Worship band/music photo — Programs, Student Ministry, Home, Watch, Worship & Music |
| `prayer-hands.jpg` | Praying hands photo — Give, Men's Ministry, Programs, Home, Prayer Ministry |
| `congregation-clapping.jpg` | Congregation clapping — Home, Programs, Prayer, Watch, Worship & Music |
| `student-worship.jpg` | Student Ministry page only |
| `missions-outreach.jpg` | Missions & Outreach page, Programs, Home |
| `youth-group.jpg` | Home, Student Ministry, Programs |
| `womens-study.jpg` | Women's Ministry page, Programs, Small Groups |
| `kids-cross-craft.jpg` | Kids Ministry page, Home, Programs |

## Adding a brand-new photo somewhere

If you want to add a photo to a spot that doesn't have one yet (or want a
photo used in only one specific place instead of reusing an existing file):

1. Drop the new file into `assets/img/photos/` with any clear file name (no
   spaces — use hyphens, like `easter-2026.jpg`).
2. Tell whoever maintains your site (or ask Claude, if you're using it) where
   you want it to go — that part still needs a one-line code change to point
   to the new file name.

## Your church logo

The logo itself (header, footer, browser tab icon) is a separate set of files
in `assets/img/` (`fbc-logo-light.png`, `fbc-logo-dark.png`, and the
`favicon-*.png` files) — replacing those follows the same rule (same file
name, new file), but if you ever get an updated logo design, it's worth asking
for help re-cropping it so it stays crisp at small sizes rather than just
dropping in the raw export.
