# CLAUDE.md

To publiczne repozytorium z kodem gry platformowej. Kod w `src/` jest
produktem specyfikacji, która leży w prywatnym repozytorium
`div037/game-platform`; tam są też propozycje zmian, błędy, skille i zasady
pracy.

- Zmiany w `src/`, `levels/`, `assets/` i `tests/` powstają wyłącznie przez
  cykl tamtego repozytorium: gałąź `change/<nazwa>`, pull request z pierwszą
  linią `Spec: <nazwa> <sha>`, auto-merge po zielonym CI.
- `main` zmienia się tylko przez pull request. Bez `push --force`.
- Kod, identyfikatory, nazwy plików i komunikaty commitów po angielsku
  (US English: `color`, `initialize`, `behavior`).
- Nie używaj długiej pauzy (em dash) w żadnym tekście; proste cudzysłowy.
- Opis pull requesta i changelog nie zawierają treści propozycji ani danych
  osobowych.
