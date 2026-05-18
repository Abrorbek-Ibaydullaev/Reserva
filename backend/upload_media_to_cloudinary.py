"""
Standalone script to upload existing local media files to Cloudinary.

Usage (from inside the backend/ directory with venv activated):
    python3.12 upload_media_to_cloudinary.py

Credentials are read from environment variables:
    CLOUDINARY_CLOUD_NAME
    CLOUDINARY_API_KEY
    CLOUDINARY_API_SECRET

If any variable is missing the script prompts for it interactively.

Folder mapping:
    backend/media/profile_pics/photo.jpg
        → Cloudinary folder: reserva/profile_pics/photo.jpg

The script is idempotent: re-running it will overwrite existing assets
at the same public_id (Cloudinary deduplicates by content anyway).
"""

import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Resolve paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent          # backend/
MEDIA_ROOT = SCRIPT_DIR / 'media'

if not MEDIA_ROOT.exists():
    print(f"ERROR: Media directory not found at {MEDIA_ROOT}")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Read / prompt for credentials
# ---------------------------------------------------------------------------
def _get_credential(env_var: str, prompt_label: str) -> str:
    value = os.environ.get(env_var, '').strip()
    if not value:
        value = input(f"Enter {prompt_label} ({env_var}): ").strip()
    if not value:
        print(f"ERROR: {env_var} is required.")
        sys.exit(1)
    return value


cloud_name = _get_credential('CLOUDINARY_CLOUD_NAME', 'Cloudinary cloud name')
api_key    = _get_credential('CLOUDINARY_API_KEY',    'Cloudinary API key')
api_secret = _get_credential('CLOUDINARY_API_SECRET', 'Cloudinary API secret')

# ---------------------------------------------------------------------------
# Configure Cloudinary SDK
# ---------------------------------------------------------------------------
try:
    import cloudinary
    import cloudinary.uploader
except ImportError:
    print("ERROR: 'cloudinary' package is not installed.")
    print("       Run:  pip install cloudinary")
    sys.exit(1)

cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret,
    secure=True,
)

# ---------------------------------------------------------------------------
# Collect files to upload
# ---------------------------------------------------------------------------
SUPPORTED_EXTENSIONS = {
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.svg', '.bmp', '.tiff', '.tif',
    '.mp4', '.mov', '.avi', '.mkv', '.webm',  # video support just in case
    '.pdf',
}

files = [
    p for p in MEDIA_ROOT.rglob('*')
    if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS
]

if not files:
    print(f"No supported media files found under {MEDIA_ROOT}")
    sys.exit(0)

print(f"Found {len(files)} file(s) to upload.\n")

# ---------------------------------------------------------------------------
# Upload loop
# ---------------------------------------------------------------------------
success_count = 0
fail_count = 0

for index, file_path in enumerate(files, start=1):
    # Build the Cloudinary public_id:
    # Strip the MEDIA_ROOT prefix to get the relative path, then prepend "reserva/"
    relative = file_path.relative_to(MEDIA_ROOT)
    # Cloudinary uses forward slashes; strip the file extension from the public_id
    # because Cloudinary appends the original extension itself.
    public_id = 'reserva/' + '/'.join(relative.with_suffix('').parts)

    print(f"[{index}/{len(files)}] Uploading: {relative}  →  {public_id}", end='  ', flush=True)

    try:
        result = cloudinary.uploader.upload(
            str(file_path),
            public_id=public_id,
            overwrite=True,
            resource_type='auto',  # handles images, videos, raw files
        )
        print(f"OK  ({result.get('secure_url', '')})")
        success_count += 1
    except Exception as exc:
        print(f"FAILED: {exc}")
        fail_count += 1

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print(f"\nDone. {success_count} uploaded, {fail_count} failed.")
if fail_count:
    print("Re-run the script to retry failed uploads — it is safe to re-upload.")
    sys.exit(1)
