# Repository Guidelines

## Project Structure & Module Organization

This is a Shopify OS 2.0 / Horizon theme. `layout/theme.liquid` is the storefront shell. `templates/*.json` assemble pages from sections. `sections/*.liquid` contain page-level UI and schema settings. `blocks/` contains reusable theme blocks. `snippets/` contains shared partials and brand overrides. `assets/` holds JS, CSS, fonts, and SVGs. `config/` stores theme settings, and `locales/` stores translations and schema copy.

Treat `templates/*.json`, `config/settings_data.json`, `sections/*-group.json`, and locale JSON as Shopify-admin-managed. Coordinate edits and avoid having the theme editor open while changing them.

## Build, Test, and Development Commands

- `shopify theme dev`: starts local preview at `http://127.0.0.1:9292`.
- `shopify theme check`: validates Liquid, schema, and theme conventions.
- `curl 'http://127.0.0.1:9292/pages/example?view=template'`: checks a new page template render path.
- `shopify theme push --live --allow-live --only sections/foo.liquid --only templates/page.foo.json`: deploys only the requested theme files.

There is no package manager build step in this repo; Shopify CLI is the source of truth.

## Coding Style & Naming Conventions

Use 2-space indentation for JSON and schema blocks. Keep CSS section-scoped unless the change is intentionally global. Put global brand overrides in `snippets/theme-overrides.liquid`; do not edit `assets/base.css`.

New page sections must follow the locked width rail: outer wrapper `section section--page-width`, inner wrapper `width: 85%; margin-inline: auto;`, and mobile inner width `100%`. Default first-section top padding should be `48px`; bottom padding should usually default to `120px`.

Prefer underscore schema IDs. If a setting ID contains dashes, access it with bracket notation, for example `section.settings['padding-block-start']`. Do not use empty string defaults in schemas.

## Testing Guidelines

No formal automated test suite exists. Before handoff, run `shopify theme check`, preview the affected page locally on desktop and mobile widths, inspect rendered DOM for layout issues, and verify links, forms, accordions, and modals.

## Commit & Pull Request Guidelines

Use short imperative commit subjects, matching history: `Add FAQ page`, `Add research partners page`, `Polish lab-results dashboard and align to site width rail`. Stage only files related to the task.

PRs should include scope, validation performed, screenshots for visual changes, and any Shopify backend setup or template-assignment notes.

## Agent-Specific Instructions

Preserve existing user changes. Do not run destructive git commands. For live deployment, push surgically with `--only` and name the exact files changed.
