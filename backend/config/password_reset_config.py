import os

PASSWORD_RESET_CONFIG = {
    "OTP_EXPIRY_MINUTES": int(os.environ.get("OTP_EXPIRY_MINUTES", 1)),
    "RESET_TOKEN_EXPIRY_MINUTES": int(os.environ.get("RESET_TOKEN_EXPIRY_MINUTES", 15)),
    "MAX_OTP_ATTEMPTS": int(os.environ.get("MAX_OTP_ATTEMPTS", 3)),
    "RATE_LIMIT_WINDOW_SECONDS": int(os.environ.get("RATE_LIMIT_WINDOW_SECONDS", 60)),
}
