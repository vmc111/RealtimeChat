import { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter key (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 px-4 pt-4 mb-2 sm:mb-0">
      <div className="relative flex">
        <textarea
          ref={textareaRef}
          rows={1}
          className="flex-1 border-0 focus:ring-0 focus:outline-none focus:placeholder-gray-400 text-gray-900 placeholder-gray-500 resize-none bg-transparent"
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{
            maxHeight: '150px',
            overflowY: 'auto',
            minHeight: '44px',
          }}
        />
        <div className="absolute right-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
          <div className="flex-shrink-0">
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              className={`inline-flex items-center justify-center rounded-full h-10 w-10 transition-colors duration-200 ${
                !message.trim() || disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Send message</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default observer(ChatInput);
