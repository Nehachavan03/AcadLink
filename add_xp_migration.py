import asyncio
from sqlalchemy import text
from app.core.database import engine

async def update_schema():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN xp INT DEFAULT 0"))
            print("Successfully added 'xp' column to users table.")
        except Exception as e:
            print(f"Failed or column already exists: {e}")

if __name__ == "__main__":
    asyncio.run(update_schema())
