import { useState } from 'react';

export function useChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (message: string) => {
    setLoading(true);
    const newMessages = [...messages, { role: 'user', content: message }];
    setMessages(newMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      setMessages([...newMessages, data]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage };
}
