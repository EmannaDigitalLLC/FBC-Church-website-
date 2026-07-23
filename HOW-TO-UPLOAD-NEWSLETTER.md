# How to Upload the Monthly Newsletter

Two simple steps, every month. No coding — just naming a file correctly and
uploading two files.

## Step 1 — Name your PDF correctly

Save this month's newsletter as a PDF named:

```
YYYY-MM.pdf
```

- 4-digit year, a dash, then 2-digit month (always use "08", not "8").
- Example: August 2026's newsletter must be named exactly **`2026-08.pdf`**.
- Example: January 2027's newsletter must be named exactly **`2027-01.pdf`**.

Upload that PDF into the **`newsletters`** folder.

## Step 2 — Add the month to the list

Open the file **`assets/js/newsletters-data.js`** (it's a plain text file —
open it in any text editor, or edit it directly on GitHub in your browser).

You'll see a list that looks like this:

```js
const NEWSLETTER_MONTHS = [
  "2026-07",
  "2026-06",
];
```

Add your new month as a new line, in quotes, with a comma at the end — it
can go anywhere in the list, it doesn't need to be first:

```js
const NEWSLETTER_MONTHS = [
  "2026-08",
  "2026-07",
  "2026-06",
];
```

Save the file and upload it alongside the PDF.

## That's it

The website automatically:
- Shows the **newest** month in your list as this month's full newsletter,
  right on the page, with a big "Open Full Newsletter" button.
- Moves every older month into the **"Past Newsletters"** list below it, as
  a simple clickable link that opens the PDF in a new tab.

You never need to mark anything as "current" — whichever month has the
latest date automatically becomes the featured one the moment you add it.
If you're a little late uploading one month, the previous month just keeps
showing until you add the new one — nothing breaks.

## Before your very first upload

The newsletter page currently shows "New newsletters are coming soon"
because no PDF has been added yet. As soon as you complete Steps 1 and 2
above for the first time, that message is replaced automatically.

## Common mistakes to avoid

- **Wrong filename format.** It must be exactly `YYYY-MM.pdf` — no month
  names, no extra words. A file named `August-Newsletter.pdf` will not show
  up.
- **Forgetting Step 2.** Uploading the PDF alone isn't enough — you also
  need to add its name to the list in `newsletters-data.js`, or the site
  won't know it exists.
- **Typos in the list.** Make sure the text you add in `newsletters-data.js`
  exactly matches the PDF filename (without `.pdf`), including quotes and a
  comma at the end of the line.
