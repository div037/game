# Levels

Tiled JSON maps with 32 x 32 px tiles. `ruins-1.json` is the first level of
the game; `test/` holds small maps used only by the tests (their content is
specified in the `debug` spec of the private repository).

Layers: `ground` (stone tiles, all solid), optional `decor` (no collision)
and `objects` with `player-start`, `exit-portal` (32 x 64 px) and `coin`
rectangles.

The tileset `ruins` has 4 tiles: 1 stone, 2 stone with a mossy top edge,
3 vine (decor), 4 crack (decor). Its `image` path points at
`assets/images/tiles/ruins.png`, which does not exist yet: the game draws
the tiles in code (`src/textures.ts`) until a CC0 pack is added. Tiled will
ask for the image when opening a map; point it at the pack's tileset then.
