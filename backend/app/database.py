import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# Allow TEST_DATABASE_URL override for test environments
_db_url = os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
# Railway provides postgresql:// but asyncpg requires postgresql+asyncpg://
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)

_is_sqlite = _db_url.startswith("sqlite")
engine = create_async_engine(
    _db_url,
    echo=False,
    **({} if _is_sqlite else {"pool_size": 5, "max_overflow": 10, "pool_timeout": 30, "pool_pre_ping": True}),
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
