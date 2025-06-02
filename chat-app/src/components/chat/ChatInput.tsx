import { Button } from '@adobe/react-spectrum'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'

import { useEffect, useRef, useState } from 'react'

import cn from 'classnames'
import { observer } from 'mobx-react-lite'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

const ChatInput = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputProps) => {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage('')
      // Reset textarea height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter key (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const isDisabled = !message.trim() || disabled

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-2 flex items-center border-t border-gray-200 bg-white px-4 py-2 shadow-lg sm:mb-0"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        className="flex-1 resize-none border border-gray-300 bg-transparent p-4 text-gray-900 placeholder-gray-500 focus:placeholder-gray-400 focus:outline-none focus:ring-0"
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{
          maxHeight: '450px',
          height: 'auto',
          flexGrow: '1',
          resize: 'none',
          overflowY: 'auto',
          minHeight: '44px',
        }}
      />
      <Button
        type="submit"
        variant="primary"
        style="outline"
        staticColor="black"
        isDisabled={isDisabled}
        UNSAFE_className={cn(
          'w-[40px] h-[40px] shrink-0 p-3 rounded-[6px] !border-none !outline-none',
          isDisabled ? '!cursor-not-allowed' : '!cursor-pointer',
          '!hover:bg-blue-50 !hover:text-white'
        )}
      >
        <PaperAirplaneIcon className="h-5 w-5" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  )
}

export default observer(ChatInput)
