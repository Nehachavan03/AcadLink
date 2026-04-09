from fastapi import APIRouter, Depends, HTTPException

from app.models.schemas import StudentDashboard, AttendanceStats, UserRole, AttendanceStatus as SchemaStatus
from app.models.models import Attendance, User, Achievement, Subject, AttendanceStatus as ModelStatus

from app.api.deps import get_current_user, RoleChecker
from app.core.database import get_database
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

async def _get_dashboard_data(db: AsyncSession, user_email: str):
    # Lookup student_id
    result = await db.execute(select(User).where(User.email == user_email))
    student = result.scalar_one_or_none()
    
    if not student:
        return None

    # Calculate Attendance Overview
    subjects_query = select(Subject).where(Subject.year == student.year)
    subjects_result = await db.execute(subjects_query)
    all_year_subjects = subjects_result.scalars().all()
    subject_names = [s.name for s in all_year_subjects]

    attendance_query = (
        select(
            Attendance.subject,
            func.count(Attendance.id).label("total"),
            func.sum(func.if_(Attendance.status == ModelStatus.PRESENT, 1, 0)).label("attended")
        )
        .where(Attendance.student_id == student.id)
        .group_by(Attendance.subject)
    )
    
    attendance_result = await db.execute(attendance_query)
    attendance_rows = {row.subject: row for row in attendance_result.all()}
    
    attendance_overview = []
    all_active_subject_names = set(subject_names) | set(attendance_rows.keys())

    for sub_name in all_active_subject_names:
        row = attendance_rows.get(sub_name)
        total = row.total if row else 0
        attended = int(row.attended or 0) if row else 0
        percentage = (attended / total * 100) if total > 0 else 0
        
        is_low = percentage < 75.0 and total > 0
        message = None
        if is_low:
            message = f"Warning: Attendance in {sub_name} is below 75%."
        elif total == 0:
            message = f"No classes conducted yet for {sub_name}."
            
        attendance_overview.append(AttendanceStats(
            subject=sub_name,
            total_classes=total,
            attended_classes=attended,
            percentage=round(percentage, 2),
            is_low_attendance=is_low,
            message=message
        ))

    # Achievements
    recent_activities = []
    achievement_query = (
        select(Achievement, User.email)
        .join(User, Achievement.awarded_by_id == User.id)
        .where(Achievement.student_id == student.id)
        .order_by(desc(Achievement.awarded_at))
        .limit(5)
    )
    result = await db.execute(achievement_query)
    achievement_rows = result.all()
    
    for row in achievement_rows:
        recent_activities.append({
            "type": "achievement",
            "title": row.Achievement.title,
            "date": row.Achievement.awarded_at.strftime("%Y-%m-%d %H:%M:%S"),
            "description": f"Awarded by {row.email}"
        })
        
    return StudentDashboard(
        full_name=student.full_name,
        email=student.email,
        attendance_overview=attendance_overview,
        recent_activities=recent_activities
    )

@router.get("/student", response_model=StudentDashboard)
async def get_student_dashboard(
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([UserRole.STUDENT]))
):
    data = await _get_dashboard_data(db, current_user["email"])
    if not data:
         raise HTTPException(status_code=404, detail="Student not found")
    return data

@router.get("/parent", response_model=StudentDashboard)
async def get_parent_dashboard(
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([UserRole.PARENT]))
):
    # Lookup parent to find linked student
    result = await db.execute(select(User).where(User.email == current_user["email"]))
    parent = result.scalar_one_or_none()
    
    if not parent or not parent.linked_student_email:
        raise HTTPException(status_code=400, detail="No linked student found for this parent account")
        
    data = await _get_dashboard_data(db, parent.linked_student_email)
    if not data:
         raise HTTPException(status_code=404, detail="Linked student record not found")
    return data


