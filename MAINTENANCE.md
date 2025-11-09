## Dépréciations Node.js détectées en CI

Le workflow CI signale plusieurs avertissements liés à des modules ou paquets dépréciés :

- `punycode` : module Node.js déprécié, utilisé par une dépendance indirecte
- `inflight`, `stable` : paquets npm non maintenus, utilisés par des dépendances internes
- `babel-jest` : plugin de test déprécié, à mettre à jour vers une version stable

Ces dépréciations n’impactent pas l’exécution actuelle du projet, mais seront surveillées et corrigées lors des prochaines mises à jour.
