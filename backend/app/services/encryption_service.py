from cryptography.fernet import Fernet
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class EncryptionService:
    def __init__(self):
        self.key = settings.master_encryption_key
        if not self.key:
            logger.warning("MASTER_ENCRYPTION_KEY not set. Encryption will fail.")
            self.fernet = None
        else:
            try:
                self.fernet = Fernet(self.key.encode() if isinstance(self.key, str) else self.key)
            except Exception as e:
                logger.error(f"Invalid MASTER_ENCRYPTION_KEY: {e}")
                self.fernet = None

    def encrypt(self, data: str) -> str:
        """Encrypts a string."""
        if not self.fernet:
            raise ValueError("Encryption service not configured (Missing Master Key).")
        return self.fernet.encrypt(data.encode()).decode()

    def decrypt(self, token: str) -> str:
        """Decrypts a token back to string."""
        if not self.fernet:
            raise ValueError("Encryption service not configured (Missing Master Key).")
        return self.fernet.decrypt(token.encode()).decode()
