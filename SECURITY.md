

## 📦 Audit des dépendances React (`npm audit`)

Le projet frontend utilise `npm audit` pour détecter les vulnérabilités connues dans les dépendances.  
Les vulnérabilités suivantes ont été identifiées mais **ne peuvent pas être corrigées automatiquement** sans casser le projet (`react-scripts@0.0.0`) :

- `nth-check <2.0.1` (High) via `svgo`
- `postcss <8.4.31` (Moderate) via `resolve-url-loader`
- `webpack-dev-server <=5.2.0` (Moderate) via `react-scripts`

Ces vulnérabilités sont **transitives**, ne touchent pas directement le code métier, et sont **documentées et surveillées**.  
Le pipeline CI affiche ces alertes sans bloquer l’exécution :

```bash
npm audit --audit-level=high || echo "Vulnérabilités connues, documentées dans SECURITY.md"

## 🐍 Audit des dépendances Python (pip-audit)
Le backend Django utilise pip-audit pour analyser les dépendances Python. ✅ Aucun paquet vulnérable n’a été détecté lors du dernier audit.