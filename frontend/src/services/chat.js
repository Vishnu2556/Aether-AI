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
    const res = await api.get(
      `/conversations/${conversationId}/messages`
    );
    return res.data;
  },

  async updateMessage(messageId, content) {
    const res = await api.patch(
      `/messages/${messageId}`,
      { content }
    );
    return res.data;
  },

  /**
   * Streams chat response using SSE over Fetch API
   */
  async streamChat({
    message,
    conversationId,
    useRag = true,
    onToken,
    onDone,
    onError,
    onMeta,
    signal,
  }) {
    const token =
      localStorage.getItem('aether_token') ||
      localStorage.getItem('vishnu_token');

    try {
      const response = await fetch(
        'https://aether-ai-1-5o3t.onrender.com/api/chat',
        {
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
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Server returned ${response.status}: ${errorText}`
        );
      }

      if (!response.body) {
        throw new Error('No response body received from server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed.startsWith('data: ')) {
            continue;
          }

          const jsonStr = trimmed.slice(6);

          try {
            const data = JSON.parse(jsonStr);

            // Server-side error
            if (data.error) {
              if (onError) {
                onError(new Error(data.error));
              }

              return;
            }

            // Initial metadata event
            if (
              data.conversation_id &&
              !data.done &&
              onMeta
            ) {
              onMeta(data);
            }

            // Streaming token
            if (data.content && onToken) {
              onToken(data.content);
            }

            // Stream completed
            if (data.done) {
              if (onDone) {
                onDone(data);
              }

              return;
            }
          } catch (err) {
            console.warn(
              'Failed to parse SSE JSON chunk:',
              jsonStr,
              err
            );
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        if (onDone) {
          onDone({
            stopped: true,
          });
        }
      } else {
        if (onError) {
          onError(err);
        }
      }
    }
  },

  /**
   * Regenerates response for a given message
   */
  async regenerateMessage({
    messageId,
    onToken,
    onDone,
    onError,
    onMeta,
    signal,
  }) {
    const token =
      localStorage.getItem('aether_token') ||
      localStorage.getItem('vishnu_token');

    try {
      const response = await fetch(
        `https://aether-ai-1-5o3t.onrender.com/api/messages/${messageId}/regenerate`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },

          signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Server returned ${response.status}: ${errorText}`
        );
      }

      if (!response.body) {
        throw new Error('No response body received from server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed.startsWith('data: ')) {
            continue;
          }

          const jsonStr = trimmed.slice(6);

          try {
            const data = JSON.parse(jsonStr);

            // Server-side error
            if (data.error) {
              if (onError) {
                onError(new Error(data.error));
              }

              return;
            }

            // Metadata event
            if (
              data.conversation_id &&
              !data.done &&
              onMeta
            ) {
              onMeta(data);
            }

            // Streaming token
            if (data.content && onToken) {
              onToken(data.content);
            }

            // Stream completed
            if (data.done) {
              if (onDone) {
                onDone(data);
              }

              return;
            }
          } catch (err) {
            console.warn(
              'Failed to parse SSE JSON chunk:',
              jsonStr,
              err
            );
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        if (onDone) {
          onDone({
            stopped: true,
          });
        }
      } else {
        if (onError) {
          onError(err);
        }
      }
    }
  },
};