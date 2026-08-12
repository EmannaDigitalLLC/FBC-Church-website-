# First Baptist Church of Rancho Cordova — AI Chat Worker

A small Cloudflare Worker that powers the AI chat widget on the website
(`chatbot.js` in the project root). It receives chat messages from the
site, calls the Claude API with a system prompt scoped to the church's
real facts (ministries, service times, giving, contact info), and
returns the reply.

It also generates a realistic spoken-voice reply via ElevenLabs (falling
back to the browser's free built-in voice if that call fails for any
reason) so replies sound like a person, not a robot reading text.

Both API keys are **never** in this repo — they're stored as encrypted
Cloudflare Worker secrets, set once via:

```bash
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put ELEVENLABS_API_KEY
```

## Live endpoint

`https://fbc-rancho-chat.emannadigital.workers.dev`

This URL is hardcoded into `chatbot.js`'s `CHAT_ENDPOINT` constant.

## Making changes

1. Edit `src/index.js` (the system prompt with church facts lives at the top).
2. Redeploy:
   ```bash
   cd chat-worker
   npx wrangler deploy
   ```
3. If you ever need to rotate a key, run the matching `wrangler secret put`
   command above again and paste the new value when prompted — the old
   one is overwritten.

## Voice

`ELEVENLABS_VOICE_ID` (optional var in `wrangler.toml`, or just edit the
default in `src/index.js`) picks which voice speaks the replies. It
defaults to "Sarah" (`EXAVITQu4vr4xnSDxMaL`), one of the account's own
premade voices. Note: ElevenLabs' free tier blocks API access to voices
browsed from their shared **Voice Library** — only voices already in your
own account's voice list (Settings → Voices in the ElevenLabs dashboard)
work on the free plan. Check `GET https://api.elevenlabs.io/v1/voices`
with your key to see what's available, or upgrade your plan to unlock
the full library.

## Allowed origins

`wrangler.toml` has an `ALLOWED_ORIGINS` var — a comma-separated list of
site origins allowed to call this Worker (CORS). Update it and redeploy
once the site moves to its real production domain (a custom domain, or
GitHub Pages).

## Cost

Uses `claude-haiku-4-5` (Anthropic's fast/cheap model) — a typical chat
exchange costs a small fraction of a cent. Cloudflare Workers free tier
covers up to 100,000 requests/day at no cost.
