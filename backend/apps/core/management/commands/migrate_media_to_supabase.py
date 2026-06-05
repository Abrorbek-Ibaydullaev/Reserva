import os
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Upload local MEDIA_ROOT files to the configured Supabase S3 storage backend."

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="List files that would be uploaded without actually uploading them.",
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        media_root = Path(getattr(settings, 'MEDIA_ROOT', ''))

        if not media_root or not media_root.exists():
            self.stderr.write(self.style.ERROR(
                f"MEDIA_ROOT '{media_root}' does not exist or is not set."
            ))
            return

        from storages.backends.s3boto3 import S3Boto3Storage
        storage = S3Boto3Storage()

        files = sorted(p for p in media_root.rglob('*') if p.is_file())

        if not files:
            self.stdout.write(self.style.WARNING("No files found in MEDIA_ROOT."))
            return

        self.stdout.write(f"Found {len(files)} file(s) under {media_root}\n")

        ok = fail = skip = 0

        for local_path in files:
            # Relative key as stored in Supabase (e.g. "profile_pics/avatar.jpg")
            relative_key = local_path.relative_to(media_root).as_posix()

            if dry_run:
                self.stdout.write(f"  [DRY-RUN] {relative_key}")
                skip += 1
                continue

            try:
                # AWS_S3_FILE_OVERWRITE=False means save() will skip if the key exists.
                # We detect a skip by checking existence before uploading.
                if storage.exists(relative_key):
                    self.stdout.write(f"  [SKIP]    {relative_key}  (already in bucket)")
                    skip += 1
                    continue

                with open(local_path, 'rb') as fh:
                    storage.save(relative_key, fh)

                public_url = storage.url(relative_key)
                self.stdout.write(self.style.SUCCESS(f"  [OK]      {relative_key}  → {public_url}"))
                ok += 1

            except Exception as exc:
                self.stderr.write(self.style.ERROR(f"  [FAIL]    {relative_key}  — {exc}"))
                fail += 1

        self.stdout.write(
            f"\nDone. uploaded={ok}  skipped={skip}  failed={fail}"
            + (" (dry-run)" if dry_run else "")
        )
