from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from .config import settings
from app.models.models import Base
import ssl

# For TiDB Cloud, SSL is required.
# We'll use a simple boolean. If that fails, we'll try a more complex context.
connect_args = {"ssl": True}

engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    echo=True,
    connect_args=connect_args
)



AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def init_db():
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    print("MySQL database initialized and tables created.")

async def get_database():
    async with AsyncSessionLocal() as session:
        yield session
