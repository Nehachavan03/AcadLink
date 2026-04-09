from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from app.core.database import get_database
from app.models.schemas import TokenData, UserRole
from app.models.models import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_database)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email, role=role)
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.email == token_data.email))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
    
    # Return as dict for compatibility with existing deps usage if possible, 
    # or return the object and update callers. 
    # Most callers use user["email"] or user["role"].
    # In SQLAlchemy model, it's user.email and user.role.
    # Let's return a dict for maximum compatibility.
    return {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value # Get string from Enum
    }

class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = [r.value if hasattr(r, 'value') else r for r in allowed_roles]

    def __call__(self, user: dict = Depends(get_current_user)):
        if user["role"] not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have enough permissions"
            )
        return user

