# Design-system mobile hero preview

These npm archives are built from the `codex/mobile-heroes` branch in `paul-design-system`, commit `5ad482f` ([PR 103](https://github.com/gpbsumido/paul-design-system/pull/103)).
They add `MobileReelHero`, `MobileOrbitHero`, and `MobileLensHero` to the existing React and CSS packages.
The app uses repository-relative dependencies so a clean checkout can install this preview without a sibling checkout or an unpublished registry version.

Replace the two `file:vendor/` dependencies with registry versions and remove these archives once the design-system changes are released.
