from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile

from app.models.schemas import NoticeCreate, NoticeResponse, UserRole as SchemaRole
from app.models.models import Notice, User, UserRole as ModelRole
from app.api.deps import get_current_user, RoleChecker
from app.core.database import get_database
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from datetime import datetime
from typing import List, Optional
import os
import uuid
import shutil

router = APIRouter(prefix="/notices", tags=["Notices"])

@router.post("/upload")
async def upload_notice_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(RoleChecker([SchemaRole.FACULTY, SchemaRole.ADMIN]))
):
    UPLOAD_DIR = "app/uploads/notices"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
    
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Use async read to avoid blocking the event loop
    content = await file.read()
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    return {"url": f"/uploads/notices/{unique_filename}"}


@router.post("/create", response_model=NoticeResponse, status_code=status.HTTP_201_CREATED)
async def create_notice(
    notice_in: NoticeCreate,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.FACULTY, SchemaRole.ADMIN]))
):
    result = await db.execute(select(User).where(User.email == current_user["email"]))
    author = result.scalar_one_or_none()

    new_notice = Notice(
        title=notice_in.title,
        content=notice_in.content,
        target_year=notice_in.target_year,
        attachment_url=notice_in.attachment_url,
        author_id=author.id
    )

    
    db.add(new_notice)
    await db.commit()
    await db.refresh(new_notice)
    
    return {
        "id": new_notice.id,
        "title": new_notice.title,
        "content": new_notice.content,
        "target_year": new_notice.target_year,
        "attachment_url": new_notice.attachment_url,
        "author_email": author.email,
        "created_at": new_notice.created_at.strftime("%Y-%m-%d %H:%M:%S")
    }


@router.get("/all", response_model=List[NoticeResponse])
async def get_notices(
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    # Fetch user for context (student/parent year)
    result = await db.execute(select(User).where(User.email == current_user["email"]))
    user = result.scalar_one_or_none()

    query = select(Notice, User.email).join(User, Notice.author_id == User.id)
    
    if user.role == ModelRole.STUDENT:
        # Show general notices + year-specific notices
        query = query.where(or_(
            Notice.target_year == None,
            Notice.target_year == user.year
        ))
    elif user.role == ModelRole.PARENT:
        # Show notices for their child's year
        res = await db.execute(select(User).where(User.email == user.linked_student_email))
        child = res.scalar_one_or_none()
        if child:
            query = query.where(or_(
                Notice.target_year == None,
                Notice.target_year == child.year
            ))
    
    query = query.order_by(Notice.created_at.desc())
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {
            "id": r.Notice.id,
            "title": r.Notice.title,
            "content": r.Notice.content,
            "target_year": r.Notice.target_year,
            "attachment_url": r.Notice.attachment_url,
            "author_email": r.email,
            "created_at": r.Notice.created_at.strftime("%Y-%m-%d %H:%M:%S")
        } for r in rows
    ]


@router.delete("/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notice(
    notice_id: int,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([SchemaRole.FACULTY, SchemaRole.ADMIN]))
):
    result = await db.execute(select(Notice).where(Notice.id == notice_id))
    notice = result.scalar_one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
        
    await db.delete(notice)
    await db.commit()
    return None
