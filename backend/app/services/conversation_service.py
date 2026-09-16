from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.conversation import Conversation
from app.models.message import Message

class ConversationService:
    @staticmethod
    def list_conversations(
        db: Session,
        user_id: int,
        search: Optional[str] = None
    ) -> List[dict]:
        query = db.query(
            Conversation,
            func.count(Message.id).label("message_count")
        ).outerjoin(Message, Conversation.id == Message.conversation_id)\
         .filter(Conversation.user_id == user_id)
        
        if search:
            search_term = f"%{search.strip().lower()}%"
            # Search both in title or in message content
            query = query.filter(
                (func.lower(Conversation.title).like(search_term)) |
                (Conversation.id.in_(
                    db.query(Message.conversation_id).filter(
                        func.lower(Message.content).like(search_term)
                    )
                ))
            )
        
        results = query.group_by(Conversation.id)\
                       .order_by(Conversation.updated_at.desc())\
                       .all()
        
        conversations = []
        for conv, count in results:
            conversations.append({
                "id": conv.id,
                "title": conv.title,
                "created_at": conv.created_at,
                "updated_at": conv.updated_at,
                "message_count": count
            })
        return conversations

    @staticmethod
    def create_conversation(
        db: Session,
        user_id: int,
        title: Optional[str] = "New Chat"
    ) -> Conversation:
        clean_title = (title or "New Chat").strip()
        conv = Conversation(user_id=user_id, title=clean_title)
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    @staticmethod
    def get_conversation_by_id(
        db: Session,
        conversation_id: int,
        user_id: int
    ) -> Conversation:
        conv = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        ).first()
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        return conv

    @staticmethod
    def update_conversation(
        db: Session,
        conversation_id: int,
        user_id: int,
        new_title: str
    ) -> Conversation:
        conv = ConversationService.get_conversation_by_id(db, conversation_id, user_id)
        conv.title = new_title.strip()
        db.commit()
        db.refresh(conv)
        return conv

    @staticmethod
    def delete_conversation(
        db: Session,
        conversation_id: int,
        user_id: int
    ) -> bool:
        conv = ConversationService.get_conversation_by_id(db, conversation_id, user_id)
        db.delete(conv)
        db.commit()
        return True

    @staticmethod
    def get_conversation_messages(
        db: Session,
        conversation_id: int,
        user_id: int
    ) -> List[Message]:
        # Validate conversation ownership
        ConversationService.get_conversation_by_id(db, conversation_id, user_id)
        return db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.asc()).all()

    @staticmethod
    def update_message_content(
        db: Session,
        message_id: int,
        user_id: int,
        content: str
    ) -> Message:
        message = db.query(Message).join(Conversation).filter(
            Message.id == message_id,
            Conversation.user_id == user_id
        ).first()
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        message.content = content.strip()
        db.commit()
        db.refresh(message)
        return message
