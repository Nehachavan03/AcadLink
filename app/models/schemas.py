from pydantic import BaseModel, EmailStr, Field, field_validator
from enum import Enum
from typing import Optional, List
from app.core.config import settings

class UserRole(str, Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    ADMIN = "ADMIN"
    PARENT = "PARENT"



class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    year: Optional[str] = None
    section: Optional[str] = None
    linked_student_email: Optional[str] = None



    @field_validator('email')
    @classmethod
    def validate_institution_email(cls, v: str):
        if not v.endswith(f"@{settings.INSTITUTION_DOMAIN}"):
            raise ValueError(f"Email must be from the domain: {settings.INSTITUTION_DOMAIN}")
        return v

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: UserRole


class UserResponse(UserBase):
    id: str = Field(alias="_id")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "email": "1012411092@despu.edu.in",
                "full_name": "John Doe",
                "role": "student"
            }
        }
    }

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[UserRole] = None

# --- Attendance Schemas ---

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"

class AttendanceCreate(BaseModel):
    student_email: EmailStr
    subject: str
    status: AttendanceStatus
    date: Optional[str] = None  # Format: YYYY-MM-DD

class BulkAttendanceRecord(BaseModel):
    student_email: EmailStr
    status: AttendanceStatus

class BulkAttendanceCreate(BaseModel):
    subject: str
    date: str  # YYYY-MM-DD
    records: List[BulkAttendanceRecord]

class AttendanceResponse(AttendanceCreate):

    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True

class AttendanceStats(BaseModel):
    subject: str
    total_classes: int
    attended_classes: int
    percentage: float
    is_low_attendance: bool = False
    message: Optional[str] = None

# --- Dashboard Schemas ---

class StudentDashboard(BaseModel):
    full_name: str
    email: EmailStr
    attendance_overview: List[AttendanceStats]
    recent_activities: List[dict] = []

# --- Assignment Schemas ---

class AssignmentCreate(BaseModel):
    title: str
    description: str
    deadline: str  # Format: YYYY-MM-DD
    subject: str
    year: str
    section: str

class AssignmentResponse(AssignmentCreate):

    id: str = Field(alias="_id")
    faculty_email: EmailStr
    created_at: str

    class Config:
        populate_by_name = True

class SubmissionCreate(BaseModel):
    assignment_id: str
    submission_text: Optional[str] = None
    submission_link: Optional[str] = None

class SubmissionResponse(BaseModel):
    id: str = Field(alias="_id")
    assignment_id: str
    student_email: EmailStr
    submission_text: Optional[str] = None
    submission_link: Optional[str] = None
    file_url: Optional[str] = None
    submitted_at: str
    marks: Optional[float] = None
    feedback: Optional[str] = None

    class Config:
        populate_by_name = True

class MarksUpdate(BaseModel):
    marks: float
    feedback: Optional[str] = None

# --- Resource Schemas ---

class ResourceCreate(BaseModel):
    title: str
    subject: str
    resource_link: str

class ResourceResponse(ResourceCreate):
    id: str = Field(alias="_id")
    uploaded_by: EmailStr
    uploaded_at: str

    class Config:
        populate_by_name = True

# --- Community Forum Schemas ---

class PostCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class ReplyCreate(BaseModel):
    post_id: str
    content: str

class ReplyResponse(BaseModel):
    id: str = Field(alias="_id")
    post_id: str
    author_email: EmailStr
    author_name: str
    content: str
    created_at: str

    class Config:
        populate_by_name = True

class PostResponse(PostCreate):
    id: str = Field(alias="_id")
    author_email: EmailStr
    author_name: str
    created_at: str
    replies: List[ReplyResponse] = []

    class Config:
        populate_by_name = True

# --- Admin Schemas ---

class UserRoleUpdate(BaseModel):
    email: EmailStr
    new_role: UserRole

class StudentDivisionUpdate(BaseModel):
    email: EmailStr
    year: str
    section: str


# --- Achievement Schemas ---

class AchievementCreate(BaseModel):
    student_email: EmailStr
    title: str
    description: str
    category: str  # e.g., Academic, Sports, Leadership

class AchievementResponse(AchievementCreate):
    id: str = Field(alias="_id")
    awarded_by: EmailStr
    awarded_at: str

    class Config:
        populate_by_name = True

# --- Notice Schemas ---

class NoticeCreate(BaseModel):
    title: str
    content: str
    target_year: Optional[str] = None
    attachment_url: Optional[str] = None

class NoticeResponse(NoticeCreate):
    id: int
    author_email: str
    created_at: str
    attachment_url: Optional[str] = None


    class Config:
        from_attributes = True


class SubjectCreate(BaseModel):

    name: str
    year: Optional[str] = None # FY, SY, TY, Final Year

class SubjectResponse(SubjectCreate):
    id: int

    class Config:
        from_attributes = True



