from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from recyclic_api.core.config import settings

db_url = settings.TEST_DATABASE_URL or settings.DATABASE_URL

# Create database engine
engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.ENVIRONMENT == "development"
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
