from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from app.models.schemas import AssignmentCreate, AssignmentResponse, SubmissionResponse, MarksUpdate, UserRole as SchemaRole
from app.models.models import Assignment, User, Submission, UserRole as ModelRole
from app.api.deps import get_current_user, RoleChecker
from app.core.database import get_database
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime
from typing import List, Optional
import os
import uuid
import shutil

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.post("/create", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assignment_in: AssignmentCreate,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.FACULTY, SchemaRole.ADMIN]))
):
    # Lookup faculty_id
    result = await db.execute(select(User).where(User.email == current_user["email"]))
    faculty = result.scalar_one_or_none()
    
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    new_assignment = Assignment(
        title=assignment_in.title,
        description=assignment_in.description,
        deadline=assignment_in.deadline,
        subject=assignment_in.subject,
        year=assignment_in.year,
        section=assignment_in.section,
        faculty_id=faculty.id
    )
    
    db.add(new_assignment)
    await db.commit()
    await db.refresh(new_assignment)
    
    return {
        "title": new_assignment.title,
        "description": new_assignment.description,
        "deadline": new_assignment.deadline,
        "subject": new_assignment.subject,
        "year": new_assignment.year,
        "section": new_assignment.section,
        "faculty_email": faculty.email,
        "created_at": new_assignment.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "_id": str(new_assignment.id)
    }


@router.get("/all", response_model=List[AssignmentResponse])
async def get_assignments(
    subject: Optional[str] = None,
    year: Optional[str] = None,
    section: Optional[str] = None,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    query = select(Assignment, User.email).join(User, Assignment.faculty_id == User.id)
    
    # 1. Subject filter (common)
    if subject:
        query = query.where(Assignment.subject == subject)
    
    # 2. Mandatory filtering for students
    if current_user["role"] == "student":
        # Lookup student's year and section
        result = await db.execute(select(User).where(User.email == current_user["email"]))
        stu = result.scalar_one_or_none()
        if stu:
            query = query.where(and_(
                Assignment.year == stu.year,
                Assignment.section == stu.section
            ))
    # 3. Optional filtering for faculty/admin
    else:
        if year:
            query = query.where(Assignment.year == year)
        if section:
            query = query.where(Assignment.section == section)

    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {
            "title": r.Assignment.title,
            "description": r.Assignment.description,
            "deadline": r.Assignment.deadline,
            "subject": r.Assignment.subject,
            "year": r.Assignment.year,
            "section": r.Assignment.section,
            "faculty_email": r.email,
            "created_at": r.Assignment.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "_id": str(r.Assignment.id)
        } for r in rows
    ]


@router.post("/submit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_assignment(
    assignment_id: str = Form(...),
    submission_text: Optional[str] = Form(None),
    submission_link: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.STUDENT]))
):
    # Lookup student
    result = await db.execute(select(User).where(User.email == current_user["email"]))
    student = result.scalar_one_or_none()
    
    # Verify assignment exists
    try:
        a_id = int(assignment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assignment ID")
        
    result = await db.execute(select(Assignment).where(Assignment.id == a_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check for existing submission
    result = await db.execute(select(Submission).where(and_(
        Submission.assignment_id == a_id,
        Submission.student_id == student.id
    )))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Assignment already submitted")

    file_url = None
    if file:
        UPLOAD_DIR = "app/uploads/submissions"
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)
        
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_url = f"/uploads/submissions/{unique_filename}"

    new_submission = Submission(
        assignment_id=a_id,
        student_id=student.id,
        submission_text=submission_text,
        submission_link=submission_link,
        file_url=file_url
    )
    
    # Reward XP
    student.xp = (student.xp or 0) + 50
    db.add(student)

    db.add(new_submission)
    await db.commit()

    await db.refresh(new_submission)
    
    return {
        "assignment_id": str(new_submission.assignment_id),
        "student_email": student.email,
        "submission_text": new_submission.submission_text,
        "submission_link": new_submission.submission_link,
        "file_url": new_submission.file_url,
        "submitted_at": new_submission.submitted_at.strftime("%Y-%m-%d %H:%M:%S"),
        "marks": new_submission.marks,
        "feedback": new_submission.feedback,
        "_id": str(new_submission.id)
    }

@router.get("/submissions/{assignment_id}", response_model=List[SubmissionResponse])
async def get_assignment_submissions(
    assignment_id: str,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.FACULTY, SchemaRole.ADMIN]))
):
    try:
        a_id = int(assignment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assignment ID")

    result = await db.execute(
        select(Submission, User.email)
        .join(User, Submission.student_id == User.id)
        .where(Submission.assignment_id == a_id)
    )
    rows = result.all()
    
    return [
        {
            "assignment_id": str(r.Submission.assignment_id),
            "student_email": r.email,
            "submission_text": r.Submission.submission_text,
            "submission_link": r.Submission.submission_link,
            "file_url": r.Submission.file_url,
            "submitted_at": r.Submission.submitted_at.strftime("%Y-%m-%d %H:%M:%S"),
            "marks": r.Submission.marks,
            "feedback": r.Submission.feedback,
            "_id": str(r.Submission.id)
        } for r in rows
    ]

@router.get("/my-submissions", response_model=List[SubmissionResponse])
async def get_my_submissions(
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.STUDENT]))
):
    result = await db.execute(select(User).where(User.email == current_user["email"]))
    student = result.scalar_one_or_none()

    result = await db.execute(
        select(Submission).where(Submission.student_id == student.id)
    )
    rows = result.scalars().all()
    
    return [
        {
            "assignment_id": str(r.assignment_id),
            "student_email": student.email,
            "submission_text": r.submission_text,
            "submission_link": r.submission_link,
            "file_url": r.file_url,
            "submitted_at": r.submitted_at.strftime("%Y-%m-%d %H:%M:%S"),
            "marks": r.marks,
            "feedback": r.feedback,
            "_id": str(r.id)
        } for r in rows
    ]

@router.delete("/unsubmit/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unsubmit_assignment(
    assignment_id: str,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.STUDENT]))
):
    result = await db.execute(select(User).where(User.email == current_user["email"]))
    student = result.scalar_one_or_none()

    try:
        a_id = int(assignment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assignment ID")

    result = await db.execute(
        select(Submission).where(and_(
            Submission.assignment_id == a_id,
            Submission.student_id == student.id
        ))
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    if submission.file_url:
        file_path = f"app{submission.file_url}"
        if os.path.exists(file_path):
            os.remove(file_path)
            
    await db.delete(submission)
    await db.commit()
    return None


@router.patch("/grade/{submission_id}", response_model=SubmissionResponse)
async def grade_submission(
    submission_id: str,
    marks_update: MarksUpdate,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.FACULTY, SchemaRole.ADMIN]))
):
    try:
        s_id = int(submission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid submission ID")
        
    result = await db.execute(
        select(Submission, User.email)
        .join(User, Submission.student_id == User.id)
        .where(Submission.id == s_id)
    )
    row = result.one_or_none()
    
    if not row:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    submission = row.Submission
    submission.marks = marks_update.marks
    submission.feedback = marks_update.feedback
    
    await db.commit()
    await db.refresh(submission)
    
    return {
        "assignment_id": str(submission.assignment_id),
        "student_email": row.email,
        "submission_text": submission.submission_text,
        "submission_link": submission.submission_link,
        "file_url": submission.file_url,
        "submitted_at": submission.submitted_at.strftime("%Y-%m-%d %H:%M:%S"),
        "marks": submission.marks,
        "feedback": submission.feedback,
        "_id": str(submission.id)
    }

