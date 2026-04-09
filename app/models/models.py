from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Float, JSON
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(enum.Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    ADMIN = "ADMIN"
    PARENT = "PARENT"



class AttendanceStatus(enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    password = Column(String(255), nullable=False)
    xp = Column(Integer, default=0)
    year = Column(String(50), nullable=True) # FY, SY, TY, Final Year
    section = Column(String(10), nullable=True) # A, B, C
    linked_student_email = Column(String(255), nullable=True) # For Parent role
    created_at = Column(DateTime, default=datetime.utcnow)





    # Relationships
    achievements = relationship("Achievement", back_populates="student", foreign_keys="Achievement.student_id", cascade="all, delete-orphan")
    awarded_achievements = relationship("Achievement", back_populates="awarded_by_user", foreign_keys="Achievement.awarded_by_id", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    assignments_created = relationship("Assignment", back_populates="faculty", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="student", cascade="all, delete-orphan")
    resources_uploaded = relationship("Resource", back_populates="uploader", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    replies = relationship("Reply", back_populates="author", cascade="all, delete-orphan")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(255), nullable=False)
    status = Column(Enum(AttendanceStatus), nullable=False)
    date = Column(String(10), nullable=False) # YYYY-MM-DD

    student = relationship("User", back_populates="attendance_records")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    deadline = Column(String(10), nullable=False) # YYYY-MM-DD
    subject = Column(String(255), nullable=False)
    year = Column(String(50), nullable=True) # FY, SY, TY, Final Year
    section = Column(String(10), nullable=True) # A, B, C
    faculty_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


    faculty = relationship("User", back_populates="assignments_created")
    submissions = relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    submission_text = Column(Text, nullable=True)
    submission_link = Column(String(512), nullable=True)
    file_url = Column(String(512), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    marks = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", back_populates="submissions")

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    resource_link = Column(String(512), nullable=False)
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    uploader = relationship("User", back_populates="resources_uploaded")

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(JSON, nullable=True) # Storing tags as JSON list
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", back_populates="posts")
    replies = relationship("Reply", back_populates="post", cascade="all, delete-orphan")


class Reply(Base):
    __tablename__ = "replies"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="replies")
    author = relationship("User", back_populates="replies")

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    awarded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    awarded_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="achievements", foreign_keys=[student_id])
    awarded_by_user = relationship("User", back_populates="awarded_achievements", foreign_keys=[awarded_by_id])

class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    target_year = Column(String(50), nullable=True) # Set to None for general notice
    attachment_url = Column(String(500), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User")

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    year = Column(String(50), nullable=True) # FY, SY, TY, Final Year






