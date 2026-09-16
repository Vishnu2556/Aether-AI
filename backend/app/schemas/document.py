from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    file_size: int
    file_type: Optional[str] = None
    status: str
    uploaded_at: datetime
    chunk_count: Optional[int] = 0

class DocumentUploadResponse(BaseModel):
    message: str
    document: DocumentResponse
