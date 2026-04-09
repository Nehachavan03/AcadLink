from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models.schemas import UserCreate, UserResponse, UserLogin, Token, UserRole as SchemaUserRole
from app.models.models import User, UserRole as ModelUserRole
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.database import get_database
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from app.core.config import settings
import traceback
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate, db: AsyncSession = Depends(get_database)):
    try:
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == user_in.email))
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Handle Parent role specific logic
        if user_in.role == SchemaUserRole.PARENT:
            if not user_in.linked_student_email:
                raise HTTPException(status_code=400, detail="Parent registration requires student email")
            
            # Verify student exists
            res = await db.execute(select(User).where(User.email == user_in.linked_student_email))
            student = res.scalar_one_or_none()
            if not student or student.role != ModelUserRole.STUDENT:
                raise HTTPException(status_code=400, detail="Linked student email not found or invalid")

        # Create new user
        hashed_password = get_password_hash(user_in.password)
        new_user = User(
            email=user_in.email,
            full_name=user_in.full_name,
            role=ModelUserRole[user_in.role.name],
            password=hashed_password,
            year=user_in.year if user_in.role == SchemaUserRole.STUDENT else None,
            section=user_in.section if user_in.role == SchemaUserRole.STUDENT else None,
            linked_student_email=user_in.linked_student_email if user_in.role == SchemaUserRole.PARENT else None
        )

        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        # Convert to dict and handle ID for response model compatibility
        user_data = {
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": SchemaUserRole(new_user.role.value),
            "year": new_user.year,
            "section": new_user.section,
            "linked_student_email": new_user.linked_student_email,
            "_id": str(new_user.id)
        }

        return user_data
    except Exception as e:
        print(traceback.format_exc())
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_database)
):
    try:
        result = await db.execute(select(User).where(User.email == form_data.username))
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(form_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "role": user.role.value},
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@router.post("/login/json", response_model=Token)
async def login_json(user_in: UserLogin, db: AsyncSession = Depends(get_database)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_in.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Role validation (Case-insensitive)
    if user.role.value.upper() != user_in.role.value.upper():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Access denied. You are registered as {user.role.value}, but tried to log in as {user_in.role.value}."
        )

    
    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}


