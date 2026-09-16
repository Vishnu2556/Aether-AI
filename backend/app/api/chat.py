from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.message import Message
from app.models.conversation import Conversation
from app.schemas.chat import ChatRequest
from app.services.chat_service import ChatService

router = APIRouter(tags=["Chat"])

@router.post("/api/chat")
async def chat_stream(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return StreamingResponse(
        ChatService.stream_chat_response(
            db=db,
            user_id=current_user.id,
            message_text=payload.message,
            conversation_id=payload.conversation_id,
            use_rag=payload.use_rag
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/api/messages/{message_id}/regenerate")
async def regenerate_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_msg = db.query(Message).join(Conversation).filter(
        Message.id == message_id,
        Conversation.user_id == current_user.id
    ).first()

    if not target_msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )

    # Determine user prompt to re-run
    if target_msg.role == "assistant":
        # Find preceding user message
        prev_user_msg = db.query(Message).filter(
            Message.conversation_id == target_msg.conversation_id,
            Message.created_at <= target_msg.created_at,
            Message.role == "user"
        ).order_by(Message.created_at.desc()).first()

        if not prev_user_msg:
            raise HTTPException(status_code=400, detail="Cannot find user message to regenerate")

        # Delete the assistant message so it gets replaced
        conv_id = target_msg.conversation_id
        db.delete(target_msg)
        db.commit()

        return StreamingResponse(
            ChatService.stream_chat_response(
                db=db,
                user_id=current_user.id,
                message_text=prev_user_msg.content,
                conversation_id=conv_id,
                use_rag=True
            ),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
    else:
        # User message: regenerate the response following it
        conv_id = target_msg.conversation_id
        # Delete following assistant message if any
        next_assistant_msg = db.query(Message).filter(
            Message.conversation_id == conv_id,
            Message.created_at >= target_msg.created_at,
            Message.role == "assistant"
        ).order_by(Message.created_at.asc()).first()
        if next_assistant_msg:
            db.delete(next_assistant_msg)
            db.commit()

        return StreamingResponse(
            ChatService.stream_chat_response(
                db=db,
                user_id=current_user.id,
                message_text=target_msg.content,
                conversation_id=conv_id,
                use_rag=True
            ),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
