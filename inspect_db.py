import asyncio
from sqlalchemy import text
from app.core.database import engine

async def inspect():
    try:
        async with engine.connect() as conn:
            # Check parents
            print("\n--- PARENT ACCOUNTS ---")
            res = await conn.execute(text("SELECT email, role, linked_student_email FROM users WHERE role='PARENT'"))
            for r in res:
                print(f"Parent: {r[0]}, Role: {r[1]}, Linked To: {r[2]}")
            
            # Check notice count
            res = await conn.execute(text("SELECT count(*) FROM notices"))
            print(f"\nTotal Notices: {res.scalar()}")

            # Check achievements for specific student
            # The screenshot shows student: 1012411092@despu.edu.in
            target_student = "1012411092@despu.edu.in"
            res = await conn.execute(text(f"SELECT id FROM users WHERE email='{target_student}'"))
            student_id = res.scalar()
            if student_id:
                res = await conn.execute(text(f"SELECT count(*) FROM achievements WHERE student_id={student_id}"))
                print(f"Achievements for {target_student} (ID {student_id}): {res.scalar()}")
            else:
                print(f"Student {target_student} not found!")

    except Exception as e:
        print(f"Inspection failed: {e}")

if __name__ == "__main__":
    asyncio.run(inspect())
