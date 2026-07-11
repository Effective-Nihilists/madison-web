import { defineWorkers } from 'ugly-app/shared';

// No cron workers. The template's `dailyCleanup` Postgres-prune task was removed
// during the D1-only migration — raw Postgres SQL won't run on D1 and this app
// doesn't need it.
export const cronTasks = defineWorkers({});
