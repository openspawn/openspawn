from app.auth.hmac import compute_signature, secure_compare


def test_compute_signature_deterministic() -> None:
    sig1 = compute_signature("secret", "message")
    sig2 = compute_signature("secret", "message")
    assert sig1 == sig2
    assert len(sig1) == 64  # SHA-256 hex


def test_compute_signature_different_secrets() -> None:
    sig1 = compute_signature("secret1", "message")
    sig2 = compute_signature("secret2", "message")
    assert sig1 != sig2


def test_secure_compare_equal() -> None:
    assert secure_compare("abc", "abc")


def test_secure_compare_not_equal() -> None:
    assert not secure_compare("abc", "def")


async def test_health_no_auth_required(client) -> None:  # type: ignore[no-untyped-def]
    response = await client.get("/health")
    assert response.status_code == 200
