import api from './api';

export const chatService = {
  async generateImage(prompt) {
    const res = await api.post('/images/generate', { prompt });
    return res.data;
  },

  async getConversations(search = '') {
    const params = search ? { search } : {};
    const res = await api.get('/conversations', { params });
    return res.data;
  },

  async createConversation(title = 'New Chat') {
    const res = await api.post('/conversations', { title });
    return res.data;
  },

  async getConversation(id) {
    const res = await api.get(`/conversations/${id}`);
    return res.data;
  },

  async updateConversation(id, title) {
    const res = await api.patch(`/conversations/${id}`, { title });
    return res.data;
  },

  async deleteConversation(id) {
    const res = await api.delete(`/conversations/${id}`);
    return res.data;
  },

  async getMessages(conversationId) {
    const res = await api.get(`/conversations/${conversationId}/messages`);
    return res.data;
  },

  async updateMessage(messageId, content) {
    const res = await api.patch(`/messages/${messageId}`, { content });
    return res.data;
  },

  /**
   * Streams chat response using SSE over Fetch API
   */
  async streamChat({ message, conversationId, useRag = true, onToken, onDone, onError, onMeta, signal }) {
    const token = localStorage.getItem('aether_token') || localStorage.getItem('vishnu_token');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          message,
          conversation_id: conversationId || null,
          use_rag: useRag,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last partial line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              if (data.error) {
                onError && onError(new Error(data.error));
                return;
              }

              // Initial metadata event
              if (data.conversation_id && !data.done && onMeta) {
                onMeta(data);
              }

              // Token content
              if (data.content && onToken) {
                onToken(data.content);
              }

              // Done event
              if (data.done) {
                onDone && onDone(data);
                return;
              }
            } catch (err) {
              console.warn('Failed to parse SSE JSON chunk:', jsonStr, err);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        onDone && onDone({ stopped: true });
      } else {
        onError && onError(err);
      }
    }
  },

  /**
   * Regenerates response for a given message
   */
  async regenerateMessage({ messageId, onToken, onDone, onError, onMeta, signal }) {
    const token = localStorage.getItem('aether_token') || localStorage.getItem('vishnu_token');
    try {
      const response = await fetch(`/api/messages/${messageId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              if (data.error) {
                onError && onError(new Error(data.error));
                return;
              }

              if (data.conversation_id && !data.done && onMeta) {
                onMeta(data);
              }

              if (data.content && onToken) {
                onToken(data.content);
              }

              if (data.done) {
                onDone && onDone(data);
                return;
              }
            } catch (err) {
              console.warn('Failed to parse SSE JSON chunk:', jsonStr, err);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        onDone && onDone({ stopped: true });
      } else {
        onError && onError(err);
      }
    }
  }
};
