# Wave Log

Migration du prototype HTML vers une app `Next.js + Supabase`.

## Stack

- `Next.js` App Router
- `Supabase Auth`
- `Supabase Postgres`
- `Vercel` pour le déploiement

## Démarrage local

1. Crée un projet Supabase.
2. Dans le SQL editor, exécute [supabase/schema.sql](supabase/schema.sql), puis chaque fichier de [supabase/migrations](supabase/migrations) dans l'ordre des noms (tous rejouables sans risque).
3. Crée un fichier `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# ou
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

4. Installe les dépendances:

```bash
npm install
```

5. Lance le serveur:

```bash
npm run dev
```

## Mise en prod

### Vercel

1. Crée un projet Vercel pointant sur ce dossier.
2. Ajoute les variables d'environnement:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. Déploie avec les réglages par défaut Next.js.

### Supabase à configurer avant production

Dans Supabase:

1. Va dans `Authentication` -> `URL Configuration`
2. Règle `Site URL` sur ton domaine de prod
3. Ajoute aussi ton URL de preview si besoin
4. Dans `Authentication` -> `Email Templates` -> `Confirm signup`, utilise un lien compatible SSR:

```text
{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
```

5. Vérifie que l'URL de redirection de prod est bien autorisée

### Pourquoi

L'app utilise Supabase en mode SSR. En production, la confirmation email doit passer par
`/auth/confirm` pour échanger correctement le `token_hash` contre une session.

## Structure

- [app/page.tsx](app/page.tsx): landing page
- [app/auth/login/page.tsx](app/auth/login/page.tsx): connexion
- [app/auth/signup/page.tsx](app/auth/signup/page.tsx): inscription
- [app/auth/confirm/route.ts](app/auth/confirm/route.ts): confirmation email (`token_hash` du template, ou `code` du template par défaut)
- [app/dashboard/page.tsx](app/dashboard/page.tsx): espace connecté (charge sessions, boards, spots)
- [app/api/marine-conditions/route.ts](app/api/marine-conditions/route.ts): conditions marines (prévision officielle OD Nature + Open-Meteo)
- [components/wavelog](components/wavelog): UI du dashboard (overview, formulaire, sessions, stats & quiver)
- [lib/wavelog.ts](lib/wavelog.ts): options et helpers partagés
- [lib/supabase](lib/supabase): clients Supabase navigateur/serveur/middleware
- [supabase/schema.sql](supabase/schema.sql): tables + policies RLS
- [supabase/migrations](supabase/migrations): évolutions du schéma (`spots`, conditions marines, quiver `boards`, `rename_board`)

## Notes

- Le prototype [index.html](index.html) reste la référence visuelle; son CSS est repris dans [app/wavelog.css](app/wavelog.css), avec en fin de fichier les ajustements propres à l'arbre React.
- Les données saisies dans le prototype vivent dans le `localStorage` du navigateur et ne sont pas importées dans Supabase.
