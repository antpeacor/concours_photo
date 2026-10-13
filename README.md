# Concours photo CSE

A static photo gallery (GitHub Pages) where colleagues pick their favourite photo and vote. Votes land in a Google Sheet that only you can see.

```
GitHub Pages (photos + vote buttons)  ──POST──▶  Google Apps Script  ──▶  Google Sheet (Votes / Résultats)
```

## 1. Create the Google Sheet and the vote script

1. Create a new Google Sheet, e.g. "Concours photo CSE – votes".
2. Open **Extensions → Apps Script**, delete the sample code and paste `apps-script/Code.gs`.
3. Edit `CONFIG` at the top: `VOTE_END`, `MAX_VOTES`, and optionally `ALLOWED_DOMAINS: ['yourcompany.fr']`.
4. In **Project Settings**, set the time zone to `Europe/Paris`.
5. Click **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Authorize, then copy the **Web app URL** (ends with `/exec`). Opening it in a browser should show "Le script de vote fonctionne."

> If you change the script later, use **Deploy → Manage deployments → Edit → New version**, otherwise the old code keeps running.

## 2. Configure the site

- `config.js`: paste the Web app URL into `scriptUrl`, set the title, theme, `maxVotes` and `voteEnd` (same values as in Code.gs).
- Put the contest photos in `photos/` (resize to ~1600 px wide, JPG, so the page loads fast).
- List them in `photos.json`. The `id` is what appears in the Sheet; keep titles anonymous so authors stay hidden during the vote.

## 3. Publish on GitHub Pages

1. Create a repository (e.g. `concours-photo-cse`) and upload all files, keeping the folder structure.
2. **Settings → Pages → Source: Deploy from a branch → `main` / root**.
3. After a minute the site is live at `https://<your-account>.github.io/concours-photo-cse/`.

Note: a public repo means the photos are public to anyone with the link. If that's a concern, check with your colleagues before uploading (and see the GitHub Pages visibility options on paid plans).

## 4. Retrieve the votes

- The **Votes** tab has one row per selected photo: date, voter, photo id.
- In the Sheet, use the **Concours → Calculer les résultats** menu to build a ranked **Résultats** tab.

## Making votes harder to cheat

By default, one vote per e-mail address, optionally restricted to your company domain. Someone could still type a colleague's address. For stricter control, use **vote codes**:

1. Add a tab named `Codes` to the Sheet, with one unique code per line in column A (e.g. generated with `=RANDBETWEEN(100000,999999)` then pasted as values).
2. Hand out one code per employee (paper slip, individual e-mail…).
3. In `config.js`, set `idLabel: "Votre code de vote"`, `idPlaceholder: "ex. 482913"`, `idType: "text"`.

As soon as the `Codes` tab contains codes, the script only accepts those, each one once.

## Testing locally

`photos.json` is loaded with `fetch`, so open the site through a small server rather than double-clicking the file:

```
python3 -m http.server 8000
```

then visit http://localhost:8000.
