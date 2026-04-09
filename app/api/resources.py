from fastapi import APIRouter, Depends, status, File, UploadFile, Form, HTTPException
from app.models.schemas import ResourceResponse, UserRole
from app.models.models import Resource, User
from app.api.deps import get_current_user, RoleChecker
from app.core.database import get_database
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import List, Optional
import shutil
import os
import uuid

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.post("/upload", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def upload_resource(
    title: str = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([UserRole.STUDENT, UserRole.FACULTY, UserRole.ADMIN]))
):
    # Lookup uploader
    result = await db.execute(select(User).where(User.email == current_user["email"]))
    uploader = result.scalar_one_or_none()

    # Ensure directory exists
    UPLOAD_DIR = "app/uploads"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    # Generate unique filename to avoid collisions
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

    # Relative URL for the database (matching the static mount in main.py)
    resource_link = f"/uploads/{unique_filename}"
    
    new_resource = Resource(
        title=title,
        subject=subject,
        resource_link=resource_link,
        uploader_id=uploader.id
    )
    
    db.add(new_resource)
    await db.commit()
    await db.refresh(new_resource)
    
    return {
        "title": new_resource.title,
        "subject": new_resource.subject,
        "resource_link": new_resource.resource_link,
        "uploaded_by": uploader.email,
        "uploaded_at": new_resource.uploaded_at.strftime("%Y-%m-%d %H:%M:%S"),
        "_id": str(new_resource.id)
    }

@router.get("/all", response_model=List[ResourceResponse])
async def get_resources(
    subject: Optional[str] = None,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    query = select(Resource, User.email).join(User, Resource.uploader_id == User.id)
    if subject:
        query = query.where(Resource.subject == subject)
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {
            "title": r.Resource.title,
            "subject": r.Resource.subject,
            "resource_link": r.Resource.resource_link,
            "uploaded_by": r.email,
            "uploaded_at": r.Resource.uploaded_at.strftime("%Y-%m-%d %H:%M:%S"),
            "_id": str(r.Resource.id)
        } for r in rows
    ]

@router.delete("/delete/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([UserRole.ADMIN]))
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    # Delete the physical file
    file_path = f"app{resource.resource_link}"
    if os.path.exists(file_path):
        os.remove(file_path)
        
    await db.delete(resource)
    await db.commit()
    return None


