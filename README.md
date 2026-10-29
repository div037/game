# Gra

Gra platformowa na przeglądarkę w Phaser 4 i TypeScripcie. Projektuje ją syn,
a kod pisze i testuje Claude Code na podstawie specyfikacji, która leży w
prywatnym repozytorium `div037/game-platform`. To repozytorium zawiera tylko
to, czego trzeba, żeby grę zbudować i wydać: kod, testy, konfigurację i
workflowy GitHub Actions.

## Wymagania

Node.js 22.18 lub nowszy (plik `.nvmrc` wskazuje linię 22) oraz npm.

## Uruchomienie

```
npm install
npm run dev
```

Gra działa pod adresem, który wypisze Vite (domyślnie
`http://localhost:5173/game/`).

## Sprawdzenie i build

`npm run check` uruchamia typecheck, lint, format:check i spell.
`npm run build` buduje grę do katalogu `dist/`. Build jest przygotowany pod
GitHub Pages projektu (adres `/game/`); żeby serwować grę z katalogu
głównego, utwórz plik `.env.local` z linią `VITE_BASE=/`.

## Licencja

MIT, plik `LICENSE`.
