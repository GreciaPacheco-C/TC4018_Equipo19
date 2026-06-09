from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    """
    Generates a bcrypt hash for a plain text password.
    Use this when creating test users or registering users.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies if the plain text password matches the stored hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)