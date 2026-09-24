# Prisma migration architecture

This repository has two intentional migration paths.

## Production path

`prisma/migrations` is the production history. The migration
`20251231115911_add_event_slug` is immutable because it has already been
recorded in production. Its checksum must never be changed.

Production deployments use the default command:

```bash
pnpm --dir backend run prisma:migrate:deploy
```

New production changes must be represented by forward migrations with a
timestamp after the currently deployed history. The partnership/team
migrations are ordered as follows:

1. `20260706110000_reconcile_partnership_and_team_schema`
2. `20260707120000_add_collaboration_accepted_terms`
3. `20260708120000_add_team_member_order`
4. `20260920090000_add_bilingual_team_member_fields`
5. `20260920100000_add_sponsor_product_or_tagline`

The obsolete backdated compatibility migration is intentionally not part of
this path.

## Fresh-database path

The production history contains an immutable malformed historical SQL file,
so it cannot be replayed from empty. New environments use the reviewed
snapshot at `prisma/migrations-fresh/0_init` instead:

```bash
pnpm --dir backend run prisma:migrate:fresh
```

The fresh path is only for an empty/new database. It must never be used for a
production database containing application data.

When a later schema change is introduced, create and review the forward
migration in the production path, then add the equivalent forward migration
after `0_init` in the fresh path. Both paths must be tested independently.

Do not edit or checksum-reconcile an already-applied production migration.
Do not use `prisma db push` or `prisma migrate reset` as deployment strategy.
