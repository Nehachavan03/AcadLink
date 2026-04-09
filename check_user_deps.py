import asyncio
from sqlalchemy import select, text
from app.core.database import get_database, engine
from app.models.models import User, Assignment, Resource, Achievement, Post, Reply

async def check_user_dependencies(email):
    async with engine.connect() as conn:
        # Check counts
        res = await conn.execute(text("SELECT id FROM users WHERE email=:e"), {"e": email})
        user_row = res.fetchone()
        if not user_row:
            print("User not found")
            return
        u_id = user_row[0]
        
        tables = ["assignments", "resources", "achievements", "posts", "replies"]
        # Note: achievements has awarded_by_id, others use faculty_id or similar
        print(f"Checking dependencies for user ID {u_id} ({email}):")
        
        counts = {}
        counts['assignments'] = (await conn.execute(text("SELECT COUNT(*) FROM assignments WHERE faculty_id=:id"), {"id": u_id})).scalar()
        counts['resources'] = (await conn.execute(text("SELECT COUNT(*) FROM resources WHERE uploader_id=:id"), {"id": u_id})).scalar()
        counts['achievements_awarded'] = (await conn.execute(text("SELECT COUNT(*) FROM achievements WHERE awarded_by_id=:id"), {"id": u_id})).scalar()
        counts['posts'] = (await conn.execute(text("SELECT COUNT(*) FROM posts WHERE author_id=:id"), {"id": u_id})).scalar()
        counts['replies'] = (await conn.execute(text("SELECT COUNT(*) FROM replies WHERE author_id=:id"), {"id": u_id})).scalar()
        
        for table, count in counts.items():
            print(f"- {table}: {count}")

if __name__ == "__main__":
    asyncio.run(check_user_dependencies("faculty@despu.edu.in"))
