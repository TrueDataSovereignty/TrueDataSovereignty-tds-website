# Go-live runbook: truedatasovereignty.eu (site-v3)

**Owner:** Brand & web · **Date:** 11 November 2026 · **Status:** plan only. No accounts, no DNS changes, nothing published.
This replaces `web/go-live-runbook.md` of 9 November, which was written for the old two-page site.

Every step marked **🔒 Henrik's yes** leaves this computer (an account, a payment, an upload, a DNS change). It waits for Henrik's clear yes in chat.

Tags: [T] tested here today · [V9] checked in the provider's own docs on 9 November, not checked again · [E] our estimate, not confirmed. On 11 November Scaleway's docs refused our automated read, so nothing about Scaleway is re-checked. Henrik or Brand & web must read those pages by hand before choosing route A.

## The short answer: how the site gets onto the domain

1. We make a clean copy of the site on this computer (`deploy/`).
2. Henrik picks a host in the EU (route A or B below) and opens an account.
3. The copy is uploaded to the host.
4. At the domain registrar, the DNS records for `truedatasovereignty.eu` are pointed at the host. `.com` is forwarded to `.eu`.
5. The host gets an HTTPS certificate. We check the live site.

Steps 2 to 5 each need Henrik's yes.

## 0. What we publish

- Ten pages: `index.html`, `how-it-works.html`, `platform.html`, `extension.html`, `mcp.html`, `pilot.html`, `trust.html`, `about.html`, `privacy.html`, and `404.html` for missing addresses.
- Four logo files, the Lora font with its licence, and `robots.txt`.
- English only. No cookies, no trackers, nothing loaded from another site [T: the script stops if a page links out]. Two pages (home, how it works) run a script for the drawings. The script is inside the page.
- Size: about 231 KB for pages and logos, 207 KB for the font [T].
- Canonical address: **`truedatasovereignty.eu`**. `.com` redirects to it with a 301 (site-plan.md, decision 1).

**Making the copy** (from `web/site-v3/`, nothing leaves the computer):

```
python -I logo/make_logo.py
python -I src/build.py
python -I src/build_pages.py
python -I src/audit.py
python -I src/make_deploy.py --launch
```

- Without `--launch` the copy keeps its draft marks. Use that for a private test.
- With `--launch` the script removes the draft marks (section 7). It stops with **NOT READY** and empties `deploy/` if a placeholder or draft mark is left. Today it stops, as expected: the contact address is missing, and the privacy notice has open placeholders [T].
- The script also writes `deploy-headers/` (section 2). That folder is server settings. Do not upload it as site files.
- This replaces `web/dist/` and `deploy/build_and_verify.py`. Those belong to the old site.

## 1. Choose the route (one decision, Henrik's)

| | **A. Scaleway Object Storage + Edge Services (Paris)** | **B. Small EU server with Caddy (Hetzner)** |
|---|---|---|
| Hosting | Bucket website, region `fr-par` [V9] | One small server; Caddy serves `deploy/` [E] |
| HTTPS on our domain | Only through Edge Services, with a Let's Encrypt certificate managed by Scaleway [V9] | Caddy gets and renews Let's Encrypt certificates itself [E] |
| Bare domain (`truedatasovereignty.eu`, no `www`) | Edge Services is set on a subdomain [V9]. The site would be `www.truedatasovereignty.eu`, and the registrar forwards the bare domain to it [E] | Works directly [E] |
| Security headers | **Not confirmed** that Edge Services can add them [E]. Fallback: the content policy inside each page (`--meta-csp`). Then HSTS and the framing rule are missing | Full control, file ready: `deploy-headers/Caddyfile` |
| 404 page | Bucket website takes `404.html` as its error file [V9] | In the Caddyfile [E] |
| .com → .eu | Forwarding at the registrar [E] | In the Caddyfile |
| Cost | A few euros a month (section 9) [E] | About €4–6 a month [E] |
| Upkeep | Almost none | Automatic updates on; one small server to watch |
| Owner | French [V9] | German [E] |

**Recommendation: B on Hetzner**, unless Scaleway confirms header support. site-v3 runs scripts, so the headers matter more than they did for the old site. B is the only route here that gives the bare domain, HSTS and every header. The files are the same for both routes.

## 2. Security headers

`make_deploy.py` writes them to `deploy-headers/headers.txt` and into `deploy-headers/Caddyfile`.

| Header | What it does |
|---|---|
| `Content-Security-Policy` | Nothing loads from other sites. Only the two scripts of this build may run, named by their hash. No forms, no framing. |
| `Strict-Transport-Security` (one year) | Browsers use HTTPS only. |
| `Referrer-Policy: no-referrer` | Links out do not say where the visitor came from. |
| `X-Content-Type-Options`, `X-Frame-Options`, `Cross-Origin-Opener-Policy`, `Permissions-Policy` | No type guessing, no framing, no shared window, no camera, microphone or location. |

- **The script hashes change with every build.** After each build, copy the new header file to the host, together with the pages. Old headers with new pages block the drawings.
- Tested [T]: with the policy inside the page (`--meta-csp`), the home page and how-it-works run with nothing blocked, in the built-in browser (Chromium) on this computer. Not tested: the policy sent as a real header, and Safari and Firefox.
- HSTS is kept at one year without `includeSubDomains` or preload, so a later subdomain is not locked in.
- Styles are allowed inline (`'unsafe-inline'` for styles only), as on the old site.

## 3. Pre-launch checklist (all must be ✅)

| # | Item | Who | State |
|---|---|---|---|
| 1 | `python -I src/make_deploy.py --launch` ends with **READY** | Brand & web | ❌ today: placeholders on the home page and the privacy notice |
| 2 | **Contact mailbox** on the TDS domain exists, and Henrik gives the address for the home page. A security mailbox for the Trust page if we name one | 🔒 Henrik's yes (account, payment, DNS for mail) | ❌ |
| 3 | **Logo swap yes.** The site uses the ground-line tree. The deck, extension icon, reports and `web/brand/final` still use the old logo. Henrik says yes to the swap, or accepts the mismatch at launch | 🔒 Henrik | ❌ |
| 4 | **Privacy notice** on the site. Built as `privacy.html`, linked in every footer. Eight marked placeholders must be filled: the controller (name and postal address; the company is not yet registered), the contact address, the host and its country, the host's log retention, the retention for e-mail (12 months proposed), the mail provider, the date, and whether data leaves the EU/EEA. The line on processor agreements is true only once the host's and mail provider's agreements are signed. The extension's privacy policy too, if the beta is announced | Henrik gives the facts (🔒 accounts), Brand & web fills in, Compliance reads | ❌ built, placeholders open |
| 5 | **Compliance's read done** on the final text of all pages. Their check of 11 Nov (`compliance/reviews/site-v3-seven-pages-check-20261111.md`): must-fixes M1–M5 are applied. Read again after any text change, and the privacy page when it exists | Compliance | ✅ for the seven pages of 11 Nov; ❌ for the new About and privacy pages (sent to Compliance 11 Nov) |
| 6 | **Numbers:** only ledger rows cleared for public use, each labelled "measured on synthetic data, round one" | Brand & web, Kung Barfod | ✅ for today's text |
| 7 | **Phone and browser checks:** Safari, Firefox and Chrome on a computer; one iPhone and one Android phone. The hero button on the first screen, the menu, the drawings, the 404 page. Also tab through each page with the keyboard | Henrik (phones), Brand & web | ❌ Only Chromium checked. MCP and pilot pages not yet checked by eye |
| 8 | **Trademark view on "TDS".** The site names "TDS Layer" and "TDS Layer MCP" (home, extension, MCP pages). The attorney view (name-check.md §16) comes first, or the names come off the pages | 🔒 Henrik (spend) | ❌ open |
| 9 | **Acolad:** no Acolad link or address anywhere on the site | Henrik | check |
| 10 | **Repository:** if it is ever made public, `mock/` and `mock.html` come out of the history first (reference picture with unknown rights). Not needed for hosting, since the host only gets `deploy/` | Brand & web, Henrik pushes | ❌ |
| 11 | Henrik reads the whole site once, on a phone and a computer | Henrik | ❌ |
| 12 | **Henrik's clear yes to publish** | 🔒 Henrik's yes | ❌ |

## 4. Steps, route A (Scaleway)

1. 🔒 **Henrik's yes:** a Scaleway account owned by TDS (not Acolad), 2-factor sign-in, a billing alert at €10 a month [E].
2. 🔒 **Henrik's yes:** create a bucket in `fr-par` (Paris) [V9], for example `tds-site`.
3. 🔒 **Henrik's yes:** turn on Bucket website: index file `index.html`, error file `404.html`, both at the bucket root [V9]. This makes every object in the bucket public [V9], so put nothing else in it.
4. 🔒 **Henrik's yes:** upload the **contents** of `web/site-v3/deploy/` (not the folder itself, and not `deploy-headers/`). Open the website address Scaleway shows.
5. 🔒 **Henrik's yes:** create an Edge Services pipeline on the bucket, subdomain `www.truedatasovereignty.eu`, with the Let's Encrypt certificate managed by Scaleway [V9].
6. 🔒 **Henrik's yes:** DNS at the registrar (section 6).
7. 🔒 **Henrik's yes** (a host setting): headers. If Edge Services can set them, paste `deploy-headers/headers.txt`. If not, make the copy with `--launch --meta-csp`, upload that, and record that HSTS and the framing rule are missing.
8. Check (section 8).

## 5. Steps, route B (Hetzner server with Caddy)

1. 🔒 **Henrik's yes:** a Hetzner Cloud account owned by TDS, 2-factor sign-in.
2. 🔒 **Henrik's yes:** the smallest server in Germany (Falkenstein or Nuremberg), Debian, SSH key only, firewall open for 22 (Henrik's IP only), 80 and 443 [E].
3. 🔒 **Henrik's yes:** install Caddy from its official package. Turn on automatic security updates [E].
4. 🔒 **Henrik's yes:** copy the contents of `web/site-v3/deploy/` to `/srv/site`, and `deploy-headers/Caddyfile` to `/etc/caddy/Caddyfile`. Reload Caddy [E].
5. 🔒 **Henrik's yes:** DNS at the registrar (section 6). Caddy then gets the certificates itself.
6. Check (section 8).

The Caddyfile serves the site on the bare `.eu` domain, sends `www` and both `.com` names there with a 301, shows `404.html` for missing pages, and sets every header. It is not tested on a real server [E].

## 6. DNS records (🔒 Henrik's yes; at the registrar, today Squarespace Domains)

Write down the current records first. Lower the TTL to 300 seconds a day before, so a mistake can be undone quickly. Do not touch MX records unless the mail setup says so.

| Domain | Route A | Route B |
|---|---|---|
| `truedatasovereignty.eu` (bare) | Forwarding (301) to `https://www.truedatasovereignty.eu` [E] | `A` → server IPv4; `AAAA` → server IPv6 |
| `www.truedatasovereignty.eu` | `CNAME` → the Edge Services endpoint | `A`/`AAAA` → server (Caddy redirects `www` to the bare domain) |
| `truedatasovereignty.com` and `www.` | Forwarding (301) to `https://www.truedatasovereignty.eu` [E] | `A`/`AAAA` → server (Caddy redirects to `.eu`) |
| `CAA` (both domains) | `0 issue "letsencrypt.org"` [E] | Same |

Mail records (MX, SPF, DKIM, DMARC) come from the mail provider when the mailbox is set up. That is a separate step, also 🔒 Henrik's yes.

## 7. Draft marks to remove at launch

Every page carries draft marks today. `--launch` handles them, so nobody edits pages by hand.

| Mark | Where | At launch |
|---|---|---|
| `<meta name="robots" content="noindex,nofollow">` | every page | removed |
| "(draft, not published)" | page titles | removed |
| "Draft for review. Not published." | footer | becomes "No trackers, no cookies." |
| `robots.txt` with `Disallow: /` | the copy | becomes `Allow: /` |
| "[Draft: …]" placeholders | home page (contact address), privacy notice (eight) | **not automatic.** Brand & web puts in the real facts. The launch run stops while one is there |

**Recommendation: a quiet launch.** Publish with indexing allowed, but do not announce it until design partner 1 has seen it [E]. If Henrik wants it hidden at first, upload the draft copy instead (no `--launch`) and share the link by hand. `noindex` does not hide the site from anyone who has the link.

## 8. After going live: checks

- `https://truedatasovereignty.eu` (or `www.` on route A) loads with a valid certificate. `http://` redirects to `https://`.
- `.com` and `www.` `.com` land on `.eu` with a **301**.
- All nine pages open from the menu or the footer (About and Privacy are in the footer). The drawings on the home page and on how-it-works move.
- A made-up address shows the 404 page, with status 404, and its links work. Try a deep one, like `/a/b/c`.
- Headers: developer tools, Network tab, compare with `headers.txt`. The Console shows no blocked script.
- No requests to any other domain (Network tab).
- `robots.txt` says what we chose in section 7.
- On a phone: the hero button is on the first screen, the menu works.

## 9. Rollback

- **Content mistake:** fix in `web/site-v3/src/`, rebuild, make the copy, upload again with the new headers. Before every upload, keep the previous `deploy/` and `deploy-headers/` as a dated zip. Upload that to go back.
- **Take the site offline fast** (🔒 Henrik's yes): route A, turn off Bucket website or delete the pipeline; route B, `systemctl stop caddy`.
- **DNS mistake:** set the records back to the values written down in section 6.
- **Wrong claim on the site:** take that page down first, fix second, tell Compliance.

## 10. Costs [E]

| Item | Route A | Route B |
|---|---|---|
| Hosting | cents a month | about €4–6 a month |
| HTTPS | Edge Services plan, a few euros a month (check) | free (Let's Encrypt) |
| Domains | already paid until about November 2027 | same |
| Mailbox (needed before launch) | about €3 per user a month | same |
| **Total, roughly** | **about €5–15 a month** | **about €7–12 a month** |

None of these prices is confirmed. Check each on the provider's page before Henrik signs up.
