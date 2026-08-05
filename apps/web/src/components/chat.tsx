'use client';

import { useChat } from '@/lib/use-chat';

export function Chat() {
  const { messages, loading, sendMessage } = useChat();


  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const message = formData.get('message') as string;
    sendMessage(message);
    e.currentTarget.reset();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-2 my-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 text-black self-start'}`}>
            {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          type="text"
          name="message"
          placeholder="Type your message..."
          className="w-full p-2 border rounded-lg"
          disabled={loading}
        />
      </form>
    </div>
  );
}
