import os
import shutil
import re
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.rag.pipeline import rag_pipeline

router = APIRouter(prefix="/api/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".json", ".csv"}

def sanitize_filename(filename: str) -> str:
    clean = re.sub(r"[^\w\.-]", "_", filename)
    return clean

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.uploaded_at.desc()).all()
    results = []
    for d in docs:
        results.append({
            "id": d.id,
            "filename": d.filename,
            "file_size": d.file_size,
            "file_type": d.file_type,
            "status": d.status,
            "uploaded_at": d.uploaded_at,
            "chunk_count": len(d.chunks) if d.chunks else 0
        })
    return results

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    safe_name = sanitize_filename(file.filename)
    user_upload_dir = Path(settings.UPLOAD_DIR) / f"user_{current_user.id}"
    user_upload_dir.mkdir(parents=True, exist_ok=True)
    saved_file_path = user_upload_dir / safe_name

    # Save uploaded file
    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB."
        )

    with open(saved_file_path, "wb") as f:
        f.write(file_bytes)

    # Create DB entry
    db_doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_path=str(saved_file_path),
        file_size=len(file_bytes),
        file_type=ext,
        status="processing"
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    # Process and Chunk via RAG Pipeline
    try:
        chunks = await rag_pipeline.ingest_document(
            file_path=str(saved_file_path),
            user_id=current_user.id,
            document_id=db_doc.id,
            filename=file.filename
        )

        for c in chunks:
            chunk_record = DocumentChunk(
                document_id=db_doc.id,
                chunk_index=c["index"],
                chunk_text=c["text"],
                chunk_metadata=str(c.get("metadata", {}))
            )
            db.add(chunk_record)

        db_doc.status = "ready"
        db.commit()
        db.refresh(db_doc)

        return {
            "message": "Document processed and indexed successfully",
            "document": {
                "id": db_doc.id,
                "filename": db_doc.filename,
                "file_size": db_doc.file_size,
                "file_type": db_doc.file_type,
                "status": db_doc.status,
                "uploaded_at": db_doc.uploaded_at,
                "chunk_count": len(chunks)
            }
        }
    except Exception as e:
        db_doc.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and index document: {str(e)}"
        )

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Remove physical file if exists
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception:
        pass

    # Remove vector index entries
    rag_pipeline.remove_document(current_user.id, document_id)

    # Delete DB records (cascade deletes chunks)
    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully", "id": document_id}
