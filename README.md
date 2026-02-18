# D&D Mobile Tracker (Static GitHub Repo, No Build)

This is a **static** (no build tools) GitHub Pages friendly project:
- `index.html` provides two big blocks: **Combat Tracker** and **Character Sheet**
- `combat.html` is your existing Combat Tracker (slightly modified to read class/level from the sheet)
- `js/character.js` is the local-first character sheet logic
- `js/cloud.js` is optional Supabase cloud save/load (ESM via CDN)
- `data/` contains `spells.json` and `spellcasting.json`

## Run locally
Open `index.html` in a local server (recommended) so module imports work.

### Option 1: VS Code Live Server
Install "Live Server", right click `index.html` → "Open with Live Server".

### Option 2: Python simple server
```bash
python -m http.server 8080
```
Then open: `http://localhost:8080`

## GitHub Pages (no build)
1. Push to GitHub.
2. Repo → Settings → Pages
3. Source: Deploy from branch
4. Branch: `main` (root)
5. Open your Pages URL, it will serve `index.html`

## Integration details
Character Sheet writes to localStorage key:
- `dnd_character_state_v1`

Combat Tracker reads it at load and whenever it receives:
- `postMessage({ type: "CHAR_SHEET_UPDATED" })`

Synced fields:
- `level`, `multiclass`
- `primary.classKey`, `primary.classLevel`, `primary.spellMod`, `primary.subclassPackageUrl`
- `secondary.*` when multiclass enabled
- optional: `combat.hpMax`, `combat.hpNow`, `combat.hpTemp`, `combat.acBase`

## Cloud sync (Supabase, optional)
1. Copy `config.example.js` to `config.js`
2. Fill in:
```js
export const SUPABASE_URL = "https://....supabase.co";
export const SUPABASE_ANON_KEY = "....";
```

3. In Supabase, create table + RLS policies:

```sql
create table if not exists public.characters (
  user_id uuid not null,
  character_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, character_id)
);

alter table public.characters enable row level security;

create policy "characters_select_own"
on public.characters
for select
to authenticated
using (auth.uid() = user_id);

create policy "characters_upsert_own"
on public.characters
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "characters_update_own"
on public.characters
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Enable **Anonymous sign-in** in Supabase Auth settings.
