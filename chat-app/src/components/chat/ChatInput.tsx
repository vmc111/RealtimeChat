import { useState, useRef, useEffect } from 'react';
import {Button} from '@adobe/react-spectrum'

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

  const isDisabled = !message.trim() || disabled;

  return (
    <form onSubmit={handleSubmit} className="shadow-lg px-4 p-4 mb-2 sm:mb-0 flex items-center">
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
        <div className="flex justify-between py-2 pl-3 pr-2 ml-[16px]">
          <div className="flex-shrink-0">
            <Button
                type="submit"
                variant="accent"
                isDisabled={isDisabled}
                UNSAFE_className={isDisabled ? "!cursor-not-allowed" : "!cursor-pointer"}
            >
              <PaperAirplaneIcon className="h-5 w-5"/>
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
    </form>
  );
};

export default observer(ChatInput);
