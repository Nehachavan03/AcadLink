import asyncio
from app.core.database import engine
from sqlalchemy import text

async def check():
    try:
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT * FROM subjects"))
            rows = res.fetchall()
            print(f"DEBUG: Found {len(rows)} subjects")
            for row in rows:
                print(f"DEBUG: {row}")
    except Exception as e:
        print(f"DEBUG ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(check())
