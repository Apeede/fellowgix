# Reliability Operations

## Daily Firestore backups

Run manual export:

```bash
npm run backup:firestore
```

This starts an async Firestore export to `gs://fellowgix-firestore-backups/daily/<timestamp>`.

## Automate daily backups (recommended)

Use Cloud Scheduler + Cloud Run job or Cloud Build trigger to run:

```bash
gcloud firestore export gs://fellowgix-firestore-backups/daily/$(date +%Y-%m-%d)
```

Schedule: daily at 02:00 UTC.

## Error monitoring

The app now writes browser/runtime exceptions to `errorLogs` collection.

Recommended alert:
- Trigger alert when `errorLogs` count spikes over baseline in 15 minutes.
- Route alerts to admin email / Slack.

## Audit retention

Keep `auditLogs` and `trash` for at least 90 days.
Use scheduled cleanup job only after backup verification.
