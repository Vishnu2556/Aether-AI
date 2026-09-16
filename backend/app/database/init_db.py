import logging
from app.database.database import Base, engine
# Import all models so metadata knows about them
import app.models  # noqa: F401

logger = logging.getLogger(__name__)

def init_db():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
