import { format } from 'date-fns';
import { observer } from 'mobx-react-lite';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  className?: string;
}

const MessageList = ({ messages, currentUserId, className = '' }: MessageListProps) => {
  if (messages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center text-gray-500 ${className}`}>
        <p>No messages yet. Send a message to start the conversation!</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${className}`}>
      {messages.map((message) => {
        const isCurrentUser = message.userId === currentUserId;
        const messageDate = message.timestamp?.getDate() ? message.timestamp.getDate() : new Date(message.timestamp);
        
        return (
          <div
            key={message.id}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl rounded-lg px-4 py-2 ${
                isCurrentUser
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-900 rounded-bl-none'
              }`}
            >
              <div className="flex-1">
                {!isCurrentUser && (
                  <div className="font-semibold text-sm mb-1">
                    {message.userDisplayName}
                  </div>
                )}
                <div className="text-sm break-words">{message.text}</div>
                <div
                  className={`text-xs mt-1 ${
                    isCurrentUser ? 'text-indigo-200' : 'text-gray-500'
                  }`}
                >
                  {format(messageDate, 'h:mm a')}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default observer(MessageList);
