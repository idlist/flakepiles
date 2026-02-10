# Changelog (pre 1.0)

## 0.1.5

- Fixed an issue where unparsable JSON cannot prevent the editor from saving the file.
- Added the view when loading a flakepile and failing to load a flakepile.

## 0.1.4

- When finish editing, jump to the flake just edited when finish editing (so that the flake is still trackable when reflow happens).
- Adjusted the style of lists in rendered markdown. Disabled the toggling behavior of task items (`- [ ]`) as it is not meant to be live editable.
- Added "New flakepile" command to command palette. ([#1])

[#1]: https://github.com/idlist/flakepiles/issues/1
