Changelog (pre 1.0)

## 0.3.5

- Fixed a bug where when enabling text wrapping, text in a `<pre>` block that is too long (i.e., a long word without spaces) cannot be wrapped.
- Fixed some styles on mobile.

## 0.3.4

- Fixed a bug about the auto-focus behavior.

## 0.3.3

- The input field to add new labels will only be auto-focused on desktop.
- Fixed a bug where creating a Flake will have its modification time updated.
- Fixed some styles on mobile.

## 0.3.2

- The input field to add new labels will be auto-focused when the label panel is open.
- Label can also be added by pressing Enter key, and the input field will be auto-focused again after adding the label.
- The input field to edit the label name will be auto-focused when entering editing mode.
- Tweaked some UI styling.

## 0.3.1

- Fixed a bug where "No Flakes" text was not displayed when all Flakes are filterd out by label settings.

## 0.3.0

The label system.

- Create, update, delete and sort labels.
- Attach labels to / detach labels from Flakes.
- Change label color. The color of the first label on a Flake will be the color of the Flake.
- Collapse certain labels on Flakes (those will be displayed as `+N`).
- Hide Flakes with certain labels from the view.
- Temporarily show all the hiding Flakes said above.
- Use `@label:name` to search for Flakes having certain label. The search word cannot include spaces, can only search for a single label, and are combined with OR condition.
  - e.g., `@label:a @label:c` will match a Flake with the label `abc`, but will not match a Flake with the label `a` and/or `c`.
  - `\@labels:...` searches for the literal `@labels:...`
  - This may get improved in a later version, but for now I don't want to expand it to a full query syntax.

Changes to existing features:

- Besides the option, confirmation to danger actions (deletion, cancelling) can also be skipped by clicking the corresponding button while holding Ctrl/Command button.
- Fixed a bug where the times were displayed in 12-hour format without AM/PM. It should be in 24-hour format and is not customizable.

**Note**: this version might be kind of unstable (especially on mobile). Feedback and bug reports are much appreciated.

## 0.2.5

- Fixed wrong TypeScript lib settings.

## 0.2.4

- Fixed outdated typings that might have caused the auto-review process to fail.

## 0.2.3

- Fixed various bugs.

## 0.2.2

- Supports disabling text wrapping in a Flake.
- Supports auto-expanding the content of a Flake to take its full space when there's only one image or one block of code inside a Flake.
  - Copy button will copy the content without the outer fences (` ``` `) for code.

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

Note that the process of updating data is **irreversible**: back them up first if you are not sure about it.

## 0.1.x

See [Flakepile (legacy)](https://github.com/idlist/flakepiles-legacy/blob/master/docs/changelog_pre1.0.md)
