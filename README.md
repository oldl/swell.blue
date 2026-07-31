# Wave Log

Migration du prototype HTML vers une app `Next.js + Supabase`.

## Stack

- `Next.js` App Router
- `Supabase Auth`
- `Supabase Postgres`
- `Vercel` pour le déploiement

## Démarrage local

1. Crée un projet Supabase.
2. Dans le SQL editor, exécute [supabase/schema.sql](/Users/olivier/mini-apps/swell-blue/supabase/schema.sql).
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

- [app/page.tsx](/Users/olivier/mini-apps/swell-blue/app/page.tsx): landing page
- [app/auth/login/page.tsx](/Users/olivier/mini-apps/swell-blue/app/auth/login/page.tsx): connexion
- [app/auth/signup/page.tsx](/Users/olivier/mini-apps/swell-blue/app/auth/signup/page.tsx): inscription
- [app/dashboard/page.tsx](/Users/olivier/mini-apps/swell-blue/app/dashboard/page.tsx): espace connecté
- [lib/supabase](/Users/olivier/mini-apps/swell-blue/lib/supabase): clients Supabase navigateur/serveur/middleware
- [supabase/schema.sql](/Users/olivier/mini-apps/swell-blue/supabase/schema.sql): tables + policies RLS

## Notes

- Le prototype initial reste dans [index.html](/Users/olivier/mini-apps/swell-blue/index.html) comme référence visuelle et fonctionnelle.
- Le dashboard lit déjà la table `sessions`.
- La prochaine étape naturelle est de reconnecter le formulaire complet du prototype à Supabase puis de migrer les données locales.
