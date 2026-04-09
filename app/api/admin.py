from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import UserResponse, UserRoleUpdate, UserRole as SchemaRole, SubjectCreate, SubjectResponse, StudentDivisionUpdate
from app.models.models import User, UserRole as ModelRole, Subject

from app.api.deps import get_current_user, RoleChecker
from app.core.database import get_database
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

router = APIRouter(prefix="/admin", tags=["Admin Controls"])

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.ADMIN]))
):
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    return [
        {
            "email": u.email,
            "full_name": u.full_name,
            "role": SchemaRole(u.role.value),
            "year": u.year,
            "section": u.section,
            "_id": str(u.id)
        } for u in users
    ]


@router.patch("/update-role", response_model=UserResponse)
async def update_user_role(
    role_update: UserRoleUpdate,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.ADMIN]))
):
    result = await db.execute(select(User).where(User.email == role_update.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = ModelRole[role_update.new_role.name]
    await db.commit()
    await db.refresh(user)
    
    return {
        "email": user.email,
        "full_name": user.full_name,
        "role": SchemaRole(user.role.value),
        "_id": str(user.id)
    }

@router.delete("/delete-user/{email}")
async def delete_user(
    email: str,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.ADMIN]))
):
    # Prevent admin from deleting themselves
    if email == current_user["email"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        await db.delete(user)
        await db.commit()
        return {"message": f"User {email} deleted successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

# --- Student Division Management ---

@router.patch("/update-student-division", response_model=UserResponse)
async def update_student_division(
    update_in: StudentDivisionUpdate,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.ADMIN]))
):
    result = await db.execute(select(User).where(User.email == update_in.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.year = update_in.year
    user.section = update_in.section
    await db.commit()
    await db.refresh(user)
    
    return {
        "email": user.email,
        "full_name": user.full_name,
        "role": SchemaRole(user.role.value),
        "year": user.year,
        "section": user.section,
        "_id": str(user.id)
    }

# --- Subject Management ---

@router.get("/subjects", response_model=List[SubjectResponse])
async def list_subjects(
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(Subject))
    subjects = result.scalars().all()
    return subjects


@router.post("/subjects", response_model=SubjectResponse)
async def add_subject(
    subject_in: SubjectCreate,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.ADMIN]))
):
    if not subject_in.name:
        raise HTTPException(status_code=400, detail="Subject name cannot be empty")
        
    # Check if subject with same name and same year exists
    result = await db.execute(select(Subject).where(
        Subject.name == subject_in.name,
        Subject.year == subject_in.year
    ))
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Subject '{subject_in.name}' already exists for {subject_in.year}")

    new_subject = Subject(name=subject_in.name, year=subject_in.year)
    db.add(new_subject)
    try:
        await db.commit()
        await db.refresh(new_subject)
        return new_subject
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create subject: {str(e)}")



@router.delete("/subjects/{subject_id}")
async def delete_subject(
    subject_id: int,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.ADMIN]))
):
    result = await db.execute(select(Subject).where(Subject.id == subject_id))
    subject = result.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    await db.delete(subject)
    await db.commit()
    return {"message": "Subject deleted successfully"}



