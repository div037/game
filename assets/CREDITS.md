# Credits

Every file in `assets/` is CC0 and is listed here with its author, source
and license. `assets/packs/` holds the downloaded packs as they came
(minus source files such as GIMP projects); each pack folder has a
`SOURCE.md` with the details. The game uses files copied from the packs
into `assets/images/` and `assets/audio/` with readable names (see
`openspec/project.md` in the private repository for the naming rules);
list every such copy below.

## Packs

| Path                                    | Author                        | Source                                               | License |
| --------------------------------------- | ----------------------------- | ---------------------------------------------------- | ------- |
| assets/packs/classical-ruin-tiles       | surt (Carl Olsson)            | https://opengameart.org/content/classical-ruin-tiles | CC0 1.0 |
| assets/packs/jumping-blob               | Jordan Irwin (AntumDeluge)    | https://opengameart.org/content/jumping-blob         | CC0 1.0 |
| assets/packs/glax-old-platformer-assets | Glax (mattbas)                | https://opengameart.org/node/172110                  | CC0 1.0 |
| assets/packs/portals                    | letargicdev                   | https://opengameart.org/content/portals              | CC0 1.0 |
| assets/packs/pixel-hearts               | TokyoGeisha and Nikita Sadkov | https://opengameart.org/content/pixel-hearts         | CC0 1.0 |

## Files used by the game

Derived from the packs above: cropped, scaled 2x with nearest-neighbor
sampling where the source is 16 px, and combined into sprite strips.

| File                                 | From pack                                                                                             | Author                        | License |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------- | ------- |
| assets/images/tiles/ruins.png        | classical-ruin-tiles (cells 5,11 and 3,9 and 22,2 and 26,13 of classical_ruin_tiles_1.png, scaled 2x) | surt (Carl Olsson)            | CC0 1.0 |
| assets/images/player/hero-32x32.png  | jumping-blob (blob_stand1-3 and blob_jump1-4 as one strip)                                            | Jordan Irwin (AntumDeluge)    | CC0 1.0 |
| assets/images/items/coin-32x32.png   | glax-old-platformer-assets (gold row of items/coins.png, scaled 2x)                                   | Glax (mattbas)                | CC0 1.0 |
| assets/images/ui/heart.png           | pixel-hearts (full heart, trimmed to 16 x 16 and scaled 2x)                                           | TokyoGeisha and Nikita Sadkov | CC0 1.0 |
| assets/images/items/portal-32x40.png | portals (portalRings1.png as is)                                                                      | letargicdev                   | CC0 1.0 |
