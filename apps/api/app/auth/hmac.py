import hashlib
import hmac
import os
import time

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def decrypt_secret(encrypted: bytes, encryption_key: str) -> str:
    key_bytes = bytes.fromhex(encryption_key)
    nonce = encrypted[:12]
    ciphertext = encrypted[12:]
    aesgcm = AESGCM(key_bytes)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")


def compute_signature(secret: str, message: str) -> str:
    return hmac.new(secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()


def secure_compare(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


TIMESTAMP_TOLERANCE_SECONDS = 300


def validate_timestamp(timestamp_str: str) -> None:
    request_time = int(timestamp_str)
    now = int(time.time())
    if abs(now - request_time) > TIMESTAMP_TOLERANCE_SECONDS:
        raise ValueError("Request timestamp outside valid window")


def get_encryption_key() -> str:
    key = os.environ.get("ENCRYPTION_KEY")
    if not key:
        raise RuntimeError("ENCRYPTION_KEY not configured")
    return key
