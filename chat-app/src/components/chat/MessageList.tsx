import cn from 'classnames';
import { format, isThisWeek, isToday, isYesterday, startOfHour } from 'date-fns';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useStore } from '../../store';
import type { Message, RoomMemberType } from '../../types';
import { Spinner } from '../ui/Spinner';

interface ProcessedMessage extends Omit<Message, 'createdAt'> {
  createdAt: Date;
  userPhotoURL?: string;
  userDisplayName: string;
  sending?: boolean;
}

interface MessageListProps {
  roomId: string;
  className?: string;
}

const formatMessageDate = (date: Date): string => {
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else if (isThisWeek(date, { weekStartsOn: 1 })) {
    return format(date, 'EEEE'); // Day of the week
  } else {
    return format(date, 'MMM d, yyyy');
  }
};

// Format time for hour groups (e.g., "2:00 PM")
const formatHourGroup = (date: Date): string => {
  return format(date, 'h:mm a');
};

const MessageList: React.FC<MessageListProps> = ({ roomId, className }) => {
  const { chatStore } = useStore();
  const { messages, currentUser } = chatStore;
  const currentUserId = currentUser?.id;

  useEffect(() => {
    chatStore.loadMessages(roomId);

    return () => {
      chatStore.clearMessages();
    }
  }, [roomId]);

  const getMemberWithId = (memberId: string): RoomMemberType | undefined => {
    return chatStore.currentRoom?.members.find((member) => member.id === memberId);
  }


  
  const processedMessages = messages.map((message) => {
        // Ensure required properties exist
        const messageSender = getMemberWithId(message.userId)
        const userDisplayName = messageSender ? messageSender.displayName : 'User';
        const userPhotoURL = messageSender ? messageSender.photoURL : `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=random`;
        
        return {
          ...message,
          createdAt: new Date(message.createdAt),
          userPhotoURL,
          userDisplayName,
          sending: (message as any).sending || false,
        };
      })  
   

  // Sort messages by createdAt in ascending order (oldest first)
  const sortedMessages = [...processedMessages].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  )

    // Scroll to bottom when messages change
    useEffect(() => {
      if(!sortedMessages.length) return
      const element = document.getElementById(sortedMessages[sortedMessages.length - 1].id);
      element?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
    }, [sortedMessages.length]);

  // Group messages by date and then by hour (oldest first)
  const groupedMessages = sortedMessages.reduce((acc: Record<string, Record<string, ProcessedMessage[]>>, message) => {
    const messageDate = message.createdAt;
    const dateKey = format(messageDate, 'yyyy-MM-dd');
    const hourKey = format(startOfHour(messageDate), 'yyyy-MM-dd-HH');
    
    if (!acc[dateKey]) {
      acc[dateKey] = {};
    }
    
    if (!acc[dateKey][hourKey]) {
      acc[dateKey][hourKey] = [];
    }
    
    acc[dateKey][hourKey].push(message);
    return acc;
  }, {})

  if (chatStore.loading) {
    return <Spinner className="grow w-full h-full" size="lg" />;
  }

  if (!sortedMessages.length) {
    return (
      <div className={`flex-1 h-full flex flex-col items-center justify-center text-gray-500 p-4 text-center ${className}`}>
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No messages yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Send a message to start the conversation!
        </p>
      </div>
    );
  }


  return (
    <div className={`flex-1 w-full overflow-hidden overflow-y-auto p-4 space-y-6 ${className || ''}`}>
      {Object.entries(groupedMessages).map(([date, hours]) => {
        const dateObj = new Date(date);
        const hourGroups = Object.entries(hours);
        
        return (
          <div key={date} className="space-y-2 flex flex-col grow overflow-hidden w-full">
            {/* Date separator */}
            <div className="relative flex items-center justify-center my-4 px-4 py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative px-3 bg-white dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700">
                {formatMessageDate(dateObj)}
              </div>
            </div>

            {/* Hour groups */}
            {hourGroups.map(([hourKey, hourMessages]) => {
              const hourDate = new Date(hourKey.replace(/(\d{4})-(\d{2})-(\d{2})-(\d{2})/, '$1-$2-$3T$4:00:00'));
              
              return (
                <div key={hourKey} className="space-y-1">
                  {/* Hour separator */}
                  <div className="flex items-center justify-center my-2">
                    <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {formatHourGroup(hourDate)}
                    </div>
                  </div>

                  {/* Messages for this hour */}
                  <div className="space-y-1">
                    {hourMessages.map((message, index) => {
                      const isCurrentUser = message.userId === currentUserId;
                      const messageDate = message.createdAt;
                      const showAvatar = !isCurrentUser && 
                        (index === 0 || hourMessages[index - 1].userId !== message.userId);
                      
                      return (
                        <div
                          key={message.id}
                          id={message.id}
                          className={cn(
                            'flex group grow',
                            isCurrentUser ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {/* Avatar (only for received messages and when needed) */}
                          {!isCurrentUser && showAvatar && (
                            <div className="flex-shrink-0 mr-2 self-end">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                {message.userPhotoURL ? (
                                  <img 
                                    src={message.userPhotoURL} 
                                    alt={message.userDisplayName} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {message.userDisplayName.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Message bubble */}
                          <div
                            className={cn(
                              'relative max-w-[80%] lg:max-w-[60%] rounded-2xl px-4 py-2',
                              isCurrentUser
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none',
                            )}
                          >
                            {/* Sender name (for received messages) */}
                            {!isCurrentUser && showAvatar && (
                              <div className="font-medium text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                                {message.userDisplayName}
                              </div>
                            )}

                            {/* Message content */}
                            <div className={cn("text-sm break-words", isCurrentUser ? 'text-right' : 'text-left')}>{message.content}</div>

                            {/* Message time */}
                            <div
                              className={cn(
                                'text-xs mt-1 flex justify-end items-center space-x-1',
                                isCurrentUser ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'
                              )}
                            >
                              <span>{format(messageDate, 'h:mm a')}</span>
                              {isCurrentUser && (
                                <span className="text-xs">
                                  {message.sending ? '↻' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default observer(MessageList);
