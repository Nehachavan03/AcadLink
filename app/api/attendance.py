from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import AttendanceCreate, AttendanceResponse, UserRole, AttendanceStatus as SchemaStatus, BulkAttendanceCreate, UserResponse, SubjectResponse



from app.models.models import Attendance, User, AttendanceStatus as ModelStatus, UserRole as ModelRole, Subject
from app.api.deps import get_current_user, RoleChecker
from app.core.database import get_database
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime
from typing import List, Optional


router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("/students", response_model=List[UserResponse])
async def get_students(
    year: Optional[str] = None,
    section: Optional[str] = None,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([UserRole.FACULTY, UserRole.ADMIN]))
):
    query = select(User).where(User.role == ModelRole.STUDENT)
    if year:
        query = query.where(User.year == year)
    if section:
        query = query.where(User.section == section)
        
    result = await db.execute(query)
    students = result.scalars().all()

    return [
        {
            "email": u.email,
            "full_name": u.full_name,
            "role": UserRole.STUDENT,
            "_id": str(u.id)
        } for u in students
    ]


# Only Faculty and Admin can mark attendance
@router.post("/mark", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
async def mark_attendance(
    attendance_in: AttendanceCreate,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([UserRole.FACULTY, UserRole.ADMIN]))
):
    # Verify student exists
    result = await db.execute(select(User).where(and_(User.email == attendance_in.student_email, User.role == ModelRole.STUDENT)))
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    date_str = attendance_in.date or datetime.now().strftime("%Y-%m-%d")
    
    # Check for duplicate record for same student, subject, and date
    result = await db.execute(select(Attendance).where(and_(
        Attendance.student_id == student.id,
        Attendance.subject == attendance_in.subject,
        Attendance.date == date_str
    )))
    existing_record = result.scalar_one_or_none()
    
    if existing_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance already marked for this student and subject today"
        )

    new_record = Attendance(
        student_id=student.id,
        subject=attendance_in.subject,
        status=ModelStatus[attendance_in.status.name],
        date=date_str
    )
    
    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)
    
    return {
        "student_email": student.email,
        "subject": new_record.subject,
        "status": SchemaStatus(new_record.status.value),
        "date": new_record.date,
        "_id": str(new_record.id)
    }

@router.post("/bulk-mark", status_code=status.HTTP_201_CREATED)
async def bulk_mark_attendance(
    bulk_in: BulkAttendanceCreate,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([UserRole.FACULTY, UserRole.ADMIN]))
):
    for record in bulk_in.records:
        # Verify student
        result = await db.execute(select(User).where(and_(User.email == record.student_email, User.role == ModelRole.STUDENT)))
        student = result.scalar_one_or_none()
        if not student:
            continue
            
        # Check existing
        result = await db.execute(select(Attendance).where(and_(
            Attendance.student_id == student.id,
            Attendance.subject == bulk_in.subject,
            Attendance.date == bulk_in.date
        )))
        existing = result.scalar_one_or_none()
        
        if existing:
            existing.status = ModelStatus[record.status.name]
        else:
            new_record = Attendance(
                student_id=student.id,
                subject=bulk_in.subject,
                status=ModelStatus[record.status.name],
                date=bulk_in.date
            )
            db.add(new_record)
            
    await db.commit()
    return {"message": "Attendance processed successfully"}


@router.get("/my-attendance", response_model=List[AttendanceResponse])
async def get_my_attendance(
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    # Lookup student_id from email in current_user
    result = await db.execute(select(User).where(User.email == current_user["email"]))
    student = result.scalar_one_or_none()
    
    if not student:
        return []

    result = await db.execute(select(Attendance).where(Attendance.student_id == student.id))
    records = result.scalars().all()
    
    return [
        {
            "student_email": student.email,
            "subject": r.subject,
            "status": SchemaStatus(r.status.value),
            "date": r.date,
            "_id": str(r.id)
        } for r in records
    ]

@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects(
    year: Optional[str] = None,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    query = select(Subject)
    if year:
        query = query.where(Subject.year == year)
    result = await db.execute(query)
    subjects = result.scalars().all()
    return subjects



