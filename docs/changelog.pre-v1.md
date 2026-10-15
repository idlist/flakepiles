Changelog (pre 1.0)

## 0.2.1

- Fixed various bugs.
- Adjusted for mobile layout.
  - The desktop layout was heavily relied on `scrollbar-gutter` property, which is essentially 0 in mobile view. Now there should be proper layout.

## 0.2.0

- Refactored the codebase to have cleaner overall structure.
- Supports pinning Flakes at the top of the Flakepile.
- Supports setting font size for Flakes.
- Fixes scrolling issue ([flakepiles-legacy/#4](https://github.com/idlist/flakepiles-legacy/issues/4)) via CSS `field-sizing`.
- Flake editing can be cancelled with double check.
- Flake deletion also requires double check by default. This can be disabled on each Flakepile.
- Deprecates flake name.
- Text wrapping option is not supported at the moment.

The data scheme of version 0.2.0 is not compatible with 0.1.x. Though, this does not mean your Flakepiles in 0.1.x cannot be used in 0.2.0: the plugin will auto-update the old Flakepiles to the newer data scheme.

Note that the process of updating data is **irreversible**: back up them first if you are not sure about it.

## 0.1.x

See [Flakepile (legacy)](https://github.com/idlist/flakepiles-legacy/blob/master/docs/changelog_pre1.0.md)
