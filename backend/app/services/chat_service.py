import json
import logging
from typing import AsyncGenerator, Optional, List, Dict
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.message import Message
from app.llm.factory import get_llm_provider
from app.rag.retriever import retriever
from app.core.config import settings

logger = logging.getLogger(__name__)

class ChatService:
    @staticmethod
    def _generate_simple_title(prompt: str) -> str:
        clean = " ".join(prompt.strip().split())
        words = clean.split()
        if len(words) <= 5:
            return clean[:40].title()
        return " ".join(words[:5]).title() + "..."

    @staticmethod
    async def stream_chat_response(
        db: Session,
        user_id: int,
        message_text: str,
        conversation_id: Optional[int] = None,
        use_rag: bool = True
    ) -> AsyncGenerator[str, None]:
        # 1. Ensure conversation exists
        if not conversation_id:
            conv = Conversation(user_id=user_id, title=ChatService._generate_simple_title(message_text))
            db.add(conv)
            db.commit()
            db.refresh(conv)
            conversation_id = conv.id
            is_first_message = True
        else:
            conv = db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            ).first()
            if not conv:
                yield f"data: {json.dumps({'error': 'Conversation not found', 'done': True})}\n\n"
                return
            is_first_message = len(conv.messages) == 0
            if is_first_message or conv.title == "New Chat":
                conv.title = ChatService._generate_simple_title(message_text)
                db.commit()

        # 2. Save user message to database
        user_msg = Message(
            conversation_id=conversation_id,
            role="user",
            content=message_text.strip()
        )
        db.add(user_msg)
        db.commit()
        db.refresh(user_msg)

        # Notify frontend of conversation ID and user message ID immediately
        initial_meta = {
            "conversation_id": conversation_id,
            "conversation_title": conv.title,
            "user_message_id": user_msg.id,
            "content": "",
            "done": False
        }
        yield f"data: {json.dumps(initial_meta)}\n\n"

        # 3. Retrieve conversation history up to MAX_HISTORY_MESSAGES
        history_msgs = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.asc()).all()

        # Keep last MAX_HISTORY_MESSAGES
        if len(history_msgs) > settings.MAX_HISTORY_MESSAGES:
            history_msgs = history_msgs[-settings.MAX_HISTORY_MESSAGES:]

        formatted_messages: List[Dict[str, str]] = []
        for m in history_msgs:
            formatted_messages.append({"role": m.role, "content": m.content})

        # 4. RAG Retrieval
        rag_context_str = ""
        retrieved_sources = []
        if use_rag:
            try:
                chunks = await retriever.retrieve_relevant_chunks(
                    user_id=user_id,
                    query=message_text,
                    top_k=4
                )
                if chunks:
                    context_blocks = []
                    for c in chunks:
                        fname = c.get("metadata", {}).get("filename", "document")
                        context_blocks.append(f"[Source: {fname}]\n{c['text']}")
                        if fname not in retrieved_sources:
                            retrieved_sources.append(fname)
                    rag_context_str = "\n\n---\n\n".join(context_blocks)
            except Exception as e:
                logger.error(f"RAG retrieval error: {e}")

        # 5. Build system prompt
        system_prompt = (
            f"You are {settings.APP_NAME}, an advanced, highly capable and helpful conversational AI assistant.\n"
            "Answer directly and concisely by default, like a polished chat assistant. For simple questions, "
            "use one short paragraph or a few focused bullet points, usually no more than 1-3 short paragraphs. "
            "Do not add lengthy background, repeated conclusions, or an unnecessary introduction. "
            "Only give a detailed explanation when the user asks for detail, a tutorial, or a deep analysis.\n"
            "Format all your responses using clean Markdown. When writing code, always specify the "
            "programming language in markdown code blocks."
        )

        if rag_context_str:
            system_prompt += (
                f"\n\nContext from user uploaded documents:\n"
                f"----------------------------------------\n"
                f"{rag_context_str}\n"
                f"----------------------------------------\n"
                f"Instructions for using the context:\n"
                f"- Use the provided document context to answer the user's question when relevant.\n"
                f"- If the answer is found in the documents, mention the source filename.\n"
                f"- If the user asks specifically about their documents and the answer cannot be found in the context, "
                f"clearly state that the information is not available in the uploaded documents."
            )

        # 6. Stream from LLM Provider
        llm_provider = get_llm_provider()
        accumulated_response: List[str] = []

        try:
            async for token in llm_provider.stream(
                messages=formatted_messages,
                system_prompt=system_prompt
            ):
                if token:
                    accumulated_response.append(token)
                    event_data = {
                        "content": token,
                        "done": False
                    }
                    yield f"data: {json.dumps(event_data)}\n\n"
        except Exception as e:
            logger.error(f"Error during LLM stream: {e}")
            err_msg = f"\n\n⚠️ Error during response generation: {str(e)}"
            accumulated_response.append(err_msg)
            yield f"data: {json.dumps({'content': err_msg, 'done': False})}\n\n"

        full_content = "".join(accumulated_response).strip()
        if not full_content:
            full_content = "⚠️ No response was received from the AI model."

        # 7. Persist assistant message to database
        assistant_msg = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=full_content
        )
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)

        # 8. Send completion event
        completion_meta = {
            "content": "",
            "done": True,
            "message_id": assistant_msg.id,
            "conversation_id": conversation_id,
            "conversation_title": conv.title,
            "sources": retrieved_sources
        }
        yield f"data: {json.dumps(completion_meta)}\n\n"
