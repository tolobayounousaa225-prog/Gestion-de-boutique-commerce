# MaBoutique — Gestion de boutiques et commerces

Application web de gestion pour boutiques et commerces (montants en FCFA, interface en français).

## Modules

| Module | Fonctionnalités |
|---|---|
| Tableau de bord | Produits les plus vendus, bénéfices, alertes (stock bas, crédits, dettes) |
| Stock | Entrées, sorties, inventaire, seuils d'alerte |
| Ventes | Caisse, ticket de caisse, facture |
| Clients | Historique d'achats, suivi des crédits |
| Fournisseurs | Achats/réceptions, suivi des dettes |
| Comptabilité | Journal de caisse, bilan, statistiques |

## Démarrer en local

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173

## État du projet

- [x] v0.1 — Prototype front complet (données en mémoire, réinitialisées au rechargement)
- [ ] v0.2 — Persistance des données (base de données + API backend)
- [ ] v0.3 — Authentification et gestion des utilisateurs (caissier, gérant)
- [ ] v0.4 — Multi-boutiques, impression des tickets, exports PDF/Excel

## Stack

- React 18 + Vite
- (à venir) Backend Node.js/Express ou Supabase, base PostgreSQL
