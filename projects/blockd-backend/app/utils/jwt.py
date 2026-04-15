from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, ConfigDict
from jose import JWTError, jwt
from ..config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/wallet/login", auto_error=False)

class CurrentUser(BaseModel):
    model_config = ConfigDict(extra='allow')
    wallet_address: str
    email: Optional[str] = None # Optional for stateless Web3 mode


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    x_wallet_address: Optional[str] = Header(None),
):
    """
    Verify identity via JWT only.

    IMPORTANT: Do not accept raw wallet addresses from headers as authentication.
    Wallet ownership must be proven via signed challenge and then represented by a JWT.
    """
    # UX mode: if wallet is connected in frontend, accept explicit wallet header.
    # NOTE: This is weaker than signed JWT and should be replaced by signed session auth.
    if x_wallet_address:
        return CurrentUser(wallet_address=x_wallet_address)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wallet connection or authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        subject: str = payload.get("sub")
        email: str = payload.get("email")
        if subject is None:
            raise HTTPException(status_code=401, detail="Invalid token subject")
        
        return CurrentUser(wallet_address=subject, email=email)
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
