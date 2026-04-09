from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.core.database import init_db
import os

from app.api import auth, attendance, dashboard, assignments, resources, community, achievements, admin, notices

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure uploads directory exists
    if not os.path.exists("app/uploads"):
        os.makedirs("app/uploads")
        
    # Initialize MySQL DB
    await init_db()
    
    # Run migrations
    from sqlalchemy import text
    from app.core.database import engine
    try:
        async with engine.begin() as conn:
            # Migration: XP
            try: await conn.execute(text("ALTER TABLE users ADD COLUMN xp INT DEFAULT 0"))
            except: pass
            
            # Migration: Year & Section
            try: await conn.execute(text("ALTER TABLE users ADD COLUMN year VARCHAR(50) NULL"))
            except: pass
            try: await conn.execute(text("ALTER TABLE users ADD COLUMN section VARCHAR(10) NULL"))
            except: pass
            
            # Migration: Subjects Table
            try: await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS subjects (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    year VARCHAR(50) NULL
                )
            """))
            except: pass
            
            # Migration: Subject Year Column
            try: await conn.execute(text("ALTER TABLE subjects ADD COLUMN year VARCHAR(50) NULL"))
            except: pass

            # Migration: Assignment Year/Section Columns
            try: await conn.execute(text("ALTER TABLE assignments ADD COLUMN year VARCHAR(50) NULL"))
            except: pass
            try: await conn.execute(text("ALTER TABLE assignments ADD COLUMN section VARCHAR(10) NULL"))
            except: pass
            
            # Migration: Parent Portal & Notices
            # 🚨 FIX: Modify role column enumeration to match SQLAlchemy names (UPPERCASE)
            try: await conn.execute(text("ALTER TABLE users MODIFY COLUMN role ENUM('STUDENT', 'FACULTY', 'ADMIN', 'PARENT') NOT NULL"))
            except: pass



            try: await conn.execute(text("ALTER TABLE users ADD COLUMN linked_student_email VARCHAR(255) NULL"))
            except: pass
            
            try: 
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS notices (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        content TEXT NOT NULL,
                        target_year VARCHAR(50) NULL,
                        author_id INT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (author_id) REFERENCES users(id)
                    )
                """))
            except: pass
            
            await conn.commit()

    except:
        pass # Migrations failed or already done
    
    yield

app = FastAPI(
    title="AcadLink API",
    description="Student Academic Management System Backend",
    version="1.0.0",
    lifespan=lifespan
)

# --- Static Files ---
app.mount("/uploads", StaticFiles(directory="app/uploads"), name="uploads")

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change this to your specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(attendance.router)
app.include_router(dashboard.router)
app.include_router(assignments.router)
app.include_router(resources.router)
app.include_router(community.router)
app.include_router(achievements.router)
app.include_router(admin.router)
app.include_router(notices.router)

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to AcadLink API"}
