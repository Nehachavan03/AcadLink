from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import AchievementCreate, AchievementResponse, UserRole as SchemaRole
from app.models.models import Achievement, User, UserRole as ModelRole
from app.api.deps import get_current_user, RoleChecker
from app.core.database import get_database
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from datetime import datetime

from typing import List

router = APIRouter(prefix="/achievements", tags=["Achievements"])

@router.post("/award", response_model=AchievementResponse, status_code=status.HTTP_201_CREATED)
async def award_achievement(
    achievement_in: AchievementCreate,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.FACULTY, SchemaRole.ADMIN]))
):
    # Verify student exists
    result = await db.execute(select(User).where(and_(User.email == achievement_in.student_email, User.role == ModelRole.STUDENT)))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Lookup awarder
    result = await db.execute(select(User).where(User.email == current_user["email"]))
    awarder = result.scalar_one_or_none()

    new_achievement = Achievement(
        student_id=student.id,
        title=achievement_in.title,
        description=achievement_in.description,
        category=achievement_in.category,
        awarded_by_id=awarder.id
    )
    
    db.add(new_achievement)
    await db.commit()
    await db.refresh(new_achievement)
    
    return {
        "student_email": student.email,
        "title": new_achievement.title,
        "description": new_achievement.description,
        "category": new_achievement.category,
        "awarded_by": awarder.email,
        "awarded_at": new_achievement.awarded_at.strftime("%Y-%m-%d %H:%M:%S"),
        "_id": str(new_achievement.id)
    }

@router.get("/my-achievements", response_model=List[AchievementResponse])
async def get_my_achievements(
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    # Lookup target student based on role
    result = await db.execute(select(User).where(User.email == current_user["email"]))
    db_user = result.scalar_one_or_none()
    
    if not db_user:
        return []

    target_student_id = db_user.id
    target_student_email = db_user.email

    if db_user.role == ModelRole.PARENT and db_user.linked_student_email:
        result = await db.execute(select(User).where(User.email == db_user.linked_student_email))
        student = result.scalar_one_or_none()
        if student:
            target_student_id = student.id
            target_student_email = student.email

    result = await db.execute(
        select(Achievement, User.email)
        .join(User, Achievement.awarded_by_id == User.id)
        .where(Achievement.student_id == target_student_id)
    )

    rows = result.all()
    
    return [
        {
            "student_email": target_student_email,
            "title": r.Achievement.title,
            "description": r.Achievement.description,
            "category": r.Achievement.category,
            "awarded_by": r.email,
            "awarded_at": r.Achievement.awarded_at.strftime("%Y-%m-%d %H:%M:%S"),
            "_id": str(r.Achievement.id)
        } for r in rows
    ]


@router.get("/leaderboard")
async def get_leaderboard(
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    # Fetch top 10 students ordered by xp
    result = await db.execute(
        select(User)
        .where(User.role == ModelRole.STUDENT)
        .order_by(desc(User.xp))
        .limit(10)
    )
    students = result.scalars().all()
    
    return [
        {
            "id": str(s.id),
            "full_name": s.full_name,
            "email": s.email,
            "xp": s.xp or 0
        } for s in students
    ]
