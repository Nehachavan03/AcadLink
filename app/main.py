from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.core.database import init_db
import os

from app.api import auth, attendance, dashboard, assignments, resources, community, achievements, admin, notices

# Ensure essential directories exist at module load time to prevent mount errors
os.makedirs("app/uploads", exist_ok=True)
os.makedirs("app/uploads/notices", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MySQL DB with robust error handling

    try:
        print("🚀 Initializing Database...")
        await init_db()
        print("✅ Database Connected.")
    except Exception as e:
        print(f"❌ DATABASE CONNECTION FAILED: {str(e)}")
        # In cloud environments, we might want to let the app start anyway
        # so we can see logs / debug, but for now we let it raise
    
    # Run migrations
    from sqlalchemy import text
    from app.core.database import engine
    try:
        print("🛠️ Running Database Migrations...")
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
                        attachment_url VARCHAR(500) NULL,
                        author_id INT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (author_id) REFERENCES users(id)
                    )
                """))
            except: pass

            # Migration: Notice Attachment URL
            try: await conn.execute(text("ALTER TABLE notices ADD COLUMN attachment_url VARCHAR(500) NULL"))
            except: pass
            
            await conn.commit()
        print("✅ Migrations Completed.")
    except Exception as e:
        print(f"⚠️ MIGRATION ERROR: {str(e)}")
    
    yield
    
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
