# Codex FreeLLM deployment

Configuration reproductible du Codex Desktop FreeLLM personnalisé, séparée du
profil Codex Pro et sans secret versionné.

Le backend FreeLLMAPI modifié est conservé dans
[`GuillaumeCisco/freellmapi`](https://github.com/GuillaumeCisco/freellmapi).

## Contenu

- `desktop/patch-rovo-discovery.mjs` : active la découverte du plugin Atlassian
  Rovo dans le renderer Linux et injecte le fallback requis par les modèles
  locaux en mode code.
- `config/config.toml.template` : configuration FreeLLM générique sans chemin
  utilisateur, projet approuvé, empreinte navigateur ou secret.
- `scripts/render-config.mjs` : génère un `config.toml` local depuis `.env`.

## Générer la configuration

```bash
cp .env.example .env
# Modifier uniquement .env, qui est ignoré par Git.
node scripts/render-config.mjs
```

Le résultat est écrit dans `generated/config.toml` avec le mode `0600`. Il doit
être relu avant installation dans le `CODEX_HOME` FreeLLM. Les secrets
`FREELLMAPI_API_KEY`, `CF_ACCESS_CLIENT_ID` et `CF_ACCESS_CLIENT_SECRET` restent
des variables d'environnement runtime : leurs valeurs ne sont jamais rendues
dans le TOML.

Les projets approuvés, plugins supplémentaires et empreintes Browser sont des
ajouts locaux volontaires. Ils ne figurent pas dans le modèle versionné.

## Appliquer le patch Desktop

Le patch est volontairement strict et s'arrête si le bundle minifié ne contient
pas exactement les points attendus. Cette protection évite de modifier une
nouvelle version du Desktop au mauvais endroit.

```bash
node desktop/patch-rovo-discovery.mjs /chemin/vers/renderer-app-initial.js
```

Une sauvegarde du bundle original est créée avant la première modification.

## Données exclues

Ne jamais ajouter à ce dépôt : `.env`, `auth.json`, sessions, historiques,
bases SQLite, journaux, clés SSH, tokens OAuth ou fichiers Cloudflare Access.
