import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { chatService } from '../services/chat';

export const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [useRag, setUseRag] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);

  const queryConvId = searchParams.get('c');

  // Load conversations list
  const loadConversations = async (selectId = null) => {
    try {
      const list = await chatService.getConversations();
      setConversations(list);

      const targetId = selectId || (queryConvId ? Number(queryConvId) : null);
      if (targetId) {
        const found = list.find((c) => c.id === targetId);
        if (found) {
          selectConversation(found.id);
        } else if (list.length > 0) {
          selectConversation(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Select conversation & load messages
  const selectConversation = async (id) => {
    try {
      const conv = await chatService.getConversation(id);
      setActiveConversation(conv);
      setMessages(conv.messages || []);
      setSearchParams({ c: id.toString() });
      setStreamingText('');
      setIsStreaming(false);
    } catch (err) {
      console.error('Failed to get conversation:', err);
    }
  };

  const handleNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
    setStreamingText('');
    setIsStreaming(false);
    setSearchParams({});
  };

  const handleRename = async (id, newTitle) => {
    try {
      await chatService.updateConversation(id, newTitle);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      );
      if (activeConversation?.id === id) {
        setActiveConversation((prev) => ({ ...prev, title: newTitle }));
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await chatService.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConversation?.id === id) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || isStreaming) return;

    if (text.trim().toLowerCase().startsWith('/image ')) {
      const prompt = text.trim().slice(7).trim();
      if (!prompt) return;

      setIsStreaming(true);
      setMessages((prev) => [...prev, {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: prompt,
        created_at: new Date().toISOString(),
      }]);

      try {
        const result = await chatService.generateImage(prompt);
        setMessages((prev) => [...prev, {
          id: `image-${Date.now()}`,
          role: 'assistant',
          content: `![Generated image](${result.url})`,
          created_at: new Date().toISOString(),
        }]);
      } catch (err) {
        const detail = err.response?.data?.detail || err.message;
        setMessages((prev) => [...prev, {
          id: `image-error-${Date.now()}`,
          role: 'assistant',
          content: `**Image generation unavailable:** ${detail}`,
          created_at: new Date().toISOString(),
        }]);
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    abortControllerRef.current = new AbortController();
    setIsStreaming(true);
    setStreamingText('');

    // Optimistically add user message to UI
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    let fullAccumulated = '';

    await chatService.streamChat({
      message: text,
      conversationId: activeConversation?.id || null,
      useRag,
      signal: abortControllerRef.current.signal,
      onMeta: (meta) => {
        if (meta.conversation_id && (!activeConversation || activeConversation.id !== meta.conversation_id)) {
          setActiveConversation({
            id: meta.conversation_id,
            title: meta.conversation_title,
          });
          setSearchParams({ c: meta.conversation_id.toString() });
        }
      },
      onToken: (token) => {
        fullAccumulated += token;
        setStreamingText(fullAccumulated);
      },
      onDone: (data) => {
        setIsStreaming(false);
        const finalText = fullAccumulated;
        setStreamingText('');

        if (finalText) {
          const newAssistantMsg = {
            id: data.message_id || `asst-${Date.now()}`,
            role: 'assistant',
            content: finalText,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, newAssistantMsg]);
        }

        // Refresh conversation list to update titles and ordering
        chatService.getConversations().then(setConversations).catch(() => {});
      },
      onError: (err) => {
        setIsStreaming(false);
        setStreamingText('');
        const errorMsg = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Error communicating with AI service:** ${err.message}`,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      },
    });
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRegenerate = async (messageId) => {
    if (isStreaming) return;

    abortControllerRef.current = new AbortController();
    setIsStreaming(true);
    setStreamingText('');

    // Filter out the target assistant message from UI
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    let fullAccumulated = '';

    await chatService.regenerateMessage({
      messageId,
      signal: abortControllerRef.current.signal,
      onToken: (token) => {
        fullAccumulated += token;
        setStreamingText(fullAccumulated);
      },
      onDone: (data) => {
        setIsStreaming(false);
        const finalText = fullAccumulated;
        setStreamingText('');

        if (finalText) {
          const newMsg = {
            id: data.message_id || `regen-${Date.now()}`,
            role: 'assistant',
            content: finalText,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, newMsg]);
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        setStreamingText('');
        alert(`Regeneration failed: ${err.message}`);
      },
    });
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      // 1. Update in DB
      await chatService.updateMessage(messageId, newContent);

      // 2. Update in UI
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content: newContent } : m))
      );

      // 3. Trigger regeneration from this user message
      await handleRegenerate(messageId);
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        onSelectConversation={selectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRename}
        onDeleteConversation={handleDelete}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <ChatWindow
        conversation={activeConversation}
        messages={messages}
        streamingText={streamingText}
        isStreaming={isStreaming}
        onSendMessage={handleSendMessage}
        onStopStreaming={handleStopStreaming}
        onRegenerate={handleRegenerate}
        onEditMessage={handleEditMessage}
        onOpenSidebar={() => setSidebarOpen(true)}
        onNewChat={handleNewChat}
        onNavigateToDocs={() => navigate('/documents')}
        useRag={useRag}
        setUseRag={setUseRag}
      />
    </div>
  );
};

export default Chat;
