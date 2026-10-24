# Database source of truth

The referenced `schema.sql` was not provided with the request. Place the original
file here before database features are implemented. No tables or policies have
been invented or modified.

After applying that schema to your Supabase project, generate `types/database.ts`:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/database.ts
```

Then import `Database` in all three Supabase client modules and pass it as the
client factory's generic argument. Until the schema is supplied, clients use the
SDK's default database typing and must not be used for application table queries.

Keep RLS enabled. Cross-user access checks require real users and the supplied
policies; they cannot be verified during this scaffold phase.
