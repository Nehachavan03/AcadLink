from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import PostCreate, PostResponse, ReplyCreate, ReplyResponse, UserRole
from app.models.models import Post, Reply, User
from app.api.deps import get_current_user, RoleChecker

from app.core.database import get_database
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/community", tags=["Community Forum"])

@router.post("/post", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_in: PostCreate,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    # Lookup author
    result = await db.execute(select(User).where(User.email == current_user["email"]))
    author = result.scalar_one_or_none()

    new_post = Post(
        title=post_in.title,
        content=post_in.content,
        tags=post_in.tags,
        author_id=author.id
    )
    
    # Reward XP
    author.xp = (author.xp or 0) + 10
    db.add(author)

    db.add(new_post)
    await db.commit()

    await db.refresh(new_post)
    
    return {
        "title": new_post.title,
        "content": new_post.content,
        "tags": new_post.tags,
        "author_email": author.email,
        "author_name": author.full_name,
        "created_at": new_post.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "replies": [],
        "_id": str(new_post.id)
    }

@router.post("/reply", response_model=ReplyResponse, status_code=status.HTTP_201_CREATED)
async def reply_to_post(
    reply_in: ReplyCreate,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    try:
        p_id = int(reply_in.post_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    result = await db.execute(select(Post).where(Post.id == p_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    result = await db.execute(select(User).where(User.email == current_user["email"]))
    author = result.scalar_one_or_none()

    new_reply = Reply(
        post_id=p_id,
        author_id=author.id,
        content=reply_in.content
    )
    
    # Reward XP
    author.xp = (author.xp or 0) + 5
    db.add(author)

    db.add(new_reply)
    await db.commit()

    await db.refresh(new_reply)
    
    return {
        "post_id": str(new_reply.post_id),
        "author_email": author.email,
        "author_name": author.full_name,
        "content": new_reply.content,
        "created_at": new_reply.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "_id": str(new_reply.id)
    }

@router.get("/posts", response_model=List[PostResponse])
async def get_all_posts(
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    # Fetch posts with authors and replies
    result = await db.execute(
        select(Post)
        .options(selectinload(Post.author), selectinload(Post.replies).selectinload(Reply.author))
        .order_by(desc(Post.created_at))
    )
    posts = result.scalars().all()
    
    return [
        {
            "title": p.title,
            "content": p.content,
            "tags": p.tags,
            "author_email": p.author.email,
            "author_name": p.author.full_name,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "replies": [
                {
                    "post_id": str(r.post_id),
                    "author_email": r.author.email,
                    "author_name": r.author.full_name,
                    "content": r.content,
                    "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "_id": str(r.id)
                } for r in p.replies
            ],
            "_id": str(p.id)
        } for p in posts
    ]

@router.delete("/post/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_database),
    current_user: dict = Depends(RoleChecker([UserRole.ADMIN]))
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    await db.delete(post)
    await db.commit()
    return None


