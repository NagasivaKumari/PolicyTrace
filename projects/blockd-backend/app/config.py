from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    # BLOCKD is 100% blockchain-native. No database required.
    REDIS_URL: str = "redis://127.0.0.1:6379/0"
    MONGODB_URI: str = "mongodb://localhost:27017/blockd"
    SECRET_KEY: str = "change_me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORAND_NODE: str = "https://testnet-api.algonode.cloud"
    ALGORAND_INDEXER: str = "https://testnet-idx.algonode.cloud"
    PINATA_API_KEY: str = ""
    PINATA_SECRET_KEY: str = ""
    PINATA_GATEWAY: str = "https://gateway.pinata.cloud"
    BLOCKD_AUDIT_APP_ID: int = 0
    BLOCKD_CERT_APP_ID: int = 0
    FIRECRAWL_API_KEY: str = ""
    SERPER_API_KEY: str = ""
    # SERPAPI_API_KEY is now DEPRECATED. We use Serper.dev for search discovery.
    MEM0_API_KEY: str = ""
    ALGORAND_MNEMONIC: str = ""
    PLATFORM_RECEIVER_ADDRESS: str = ""
    # Email / SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@blockd.app"
    OTP_EXPIRE_SECONDS: int = 600  # 10 minutes
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    # When false, do NOT synthesize fallback high-risk reports when no policy is found.
    # Set ALLOW_FALLBACK=false in production to require real extracted policy content.
    ALLOW_FALLBACK: bool = True
    # When true, ensure MongoDB indexes exist on startup.
    AUTO_CREATE_TABLES: bool = True
    TRUST_PROXY_HEADERS: bool = False
    RATE_LIMIT_USE_REDIS: bool = True

    model_config = ConfigDict(
        env_file=".env",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        origins = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        return origins or ["http://localhost:3000"]

    @property
    def receiver_address(self) -> str:
        """
        Derive the public address of the platform receiver.
        Prioritizes explicit PLATFORM_RECEIVER_ADDRESS from .env.
        """
        if self.PLATFORM_RECEIVER_ADDRESS:
            return self.PLATFORM_RECEIVER_ADDRESS.strip()
            
        if not self.ALGORAND_MNEMONIC:
            return ""
        try:
            import algosdk
            sk = algosdk.mnemonic.to_private_key(self.ALGORAND_MNEMONIC)
            return algosdk.account.address_from_private_key(sk)
        except Exception:
            return ""

settings = Settings()
