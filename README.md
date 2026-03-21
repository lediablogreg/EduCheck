# Suivi scolaire

Application web de suivi scolaire pour agents d'intégration.

## Comptes de démo

| Rôle  | Identifiant | Mot de passe |
|-------|-------------|--------------|
| Admin | admin       | admin123     |
| Agent | agent1      | agent123     |
| Élève | eleve1      | lea123       |
| Élève | eleve2      | tom123       |

---

## 🚀 Déploiement — Guide pas à pas

### Étape 1 — Créer un compte GitHub
1. Va sur [github.com](https://github.com) → clique **Sign up**
2. Choisis un nom d'utilisateur, email, mot de passe
3. Vérifie ton email et connecte-toi

### Étape 2 — Créer un nouveau dépôt
1. Sur GitHub, clique le bouton vert **New** (ou va sur github.com/new)
2. Nom du dépôt : `suivi-scolaire`
3. Laisse tout par défaut → clique **Create repository**

### Étape 3 — Uploader les fichiers
1. Sur la page du dépôt vide, clique **uploading an existing file**
2. Glisse-dépose **tous les fichiers du dossier `suivi-scolaire`** (dézippe d'abord si nécessaire)
3. Important : upload aussi les sous-dossiers `src/` et `public/` avec leurs fichiers
4. En bas de page, clique **Commit changes**

### Étape 4 — Créer un compte Vercel
1. Va sur [vercel.com](https://vercel.com) → clique **Sign Up**
2. Choisis **Continue with GitHub** → autorise Vercel

### Étape 5 — Déployer
1. Sur Vercel, clique **Add New Project**
2. Tu vois ton dépôt `suivi-scolaire` → clique **Import**
3. Vercel détecte automatiquement Vite → clique **Deploy**
4. Attends ~1 minute → ton app est en ligne ! 🎉

Vercel te donnera une URL du type : `https://suivi-scolaire-xxx.vercel.app`

---

## 📧 Configurer les emails (EmailJS)

1. Va sur [emailjs.com](https://emailjs.com) → crée un compte gratuit
2. **Email Services** → Add New Service → choisis Gmail ou autre
3. **Email Templates** → Create New Template
4. Dans le template, utilise ces variables :
   - `{{to_name}}` — prénom de l'élève
   - `{{from_name}}` — nom de l'agent
   - `{{subject}}` — sujet
   - `{{message}}` — corps du message
5. Dans l'app, connecte-toi en tant qu'**agent** → onglet **Notifications** → bouton **Configurer**
6. Saisis ton **Service ID**, **Template ID** et **Public Key** (trouvés dans emailjs.com)

---

## 💻 Développement local

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build
```

---

## 📁 Structure des fichiers

```
suivi-scolaire/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── storage.js          ← données localStorage
    └── components/
        ├── UI.jsx          ← composants réutilisables
        ├── Login.jsx       ← page de connexion
        ├── EleveView.jsx   ← interface élève
        ├── AgentView.jsx   ← interface agent
        └── AdminView.jsx   ← interface admin
```
