from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import (
    ConversationResponse,
    ConversationDetailResponse,
    ConversationCreate,
    ConversationUpdate,
    MessageResponse,
    MessageUpdate,
)
from app.services.conversation_service import ConversationService

router = APIRouter(tags=["Conversations"])

@router.get("/api/conversations", response_model=List[ConversationResponse])
def get_conversations(
    search: Optional[str] = Query(None, description="Search term for title or message content"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ConversationService.list_conversations(db, current_user.id, search)

@router.post("/api/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: Optional[ConversationCreate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    title = payload.title if payload else "New Chat"
    conv = ConversationService.create_conversation(db, current_user.id, title)
    return {
        "id": conv.id,
        "title": conv.title,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "message_count": 0
    }

@router.get("/api/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = ConversationService.get_conversation_by_id(db, conversation_id, current_user.id)
    return conv

@router.patch("/api/conversations/{conversation_id}", response_model=ConversationResponse)
def rename_conversation(
    conversation_id: int,
    payload: ConversationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = ConversationService.update_conversation(db, conversation_id, current_user.id, payload.title)
    messages_count = len(conv.messages) if conv.messages else 0
    return {
        "id": conv.id,
        "title": conv.title,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "message_count": messages_count
    }

@router.delete("/api/conversations/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ConversationService.delete_conversation(db, conversation_id, current_user.id)
    return {"message": "Conversation deleted successfully", "id": conversation_id}

@router.get("/api/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ConversationService.get_conversation_messages(db, conversation_id, current_user.id)

@router.patch("/api/messages/{message_id}", response_model=MessageResponse)
def edit_message(
    message_id: int,
    payload: MessageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ConversationService.update_message_content(db, message_id, current_user.id, payload.content)
