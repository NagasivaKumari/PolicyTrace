"""
Password validation rules enforced on signup.

Rules:
  - Minimum 8 characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one digit (0-9)
  - At least one special character from: !@#$%^&*()_+-=[]{}|;':\",./<>?
"""

import re

_SPECIAL = r"""!@#$%^&*()_+\-=\[\]{}|;':",./<>?"""

_RULES = [
    (r".{8,}", "Password must be at least 8 characters long."),
    (r"[A-Z]", "Password must contain at least one uppercase letter."),
    (r"[a-z]", "Password must contain at least one lowercase letter."),
    (r"[0-9]", "Password must contain at least one digit."),
    (rf"[{_SPECIAL}]", "Password must contain at least one special character (!@#$%^&* etc.)."),
]

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,30}$")


def validate_password(password: str) -> list[str]:
    """Return a list of validation error messages (empty list = valid)."""
    errors: list[str] = []
    for pattern, message in _RULES:
        if not re.search(pattern, password):
            errors.append(message)
    return errors


def validate_username(username: str) -> list[str]:
    """
    Username rules:
      - 3-30 characters
      - Letters, digits, and underscores only
    """
    errors: list[str] = []
    if not username or not isinstance(username, str):
        errors.append("Username is required.")
        return errors
    if not _USERNAME_RE.match(username):
        errors.append(
            "Username must be 3-30 characters and contain only letters, digits, and underscores."
        )
    return errors
