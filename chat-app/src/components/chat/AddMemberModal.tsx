import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ActionButton, Button, Dialog, DialogTrigger, Heading, TextField, View } from '@adobe/react-spectrum';
import { useStore } from '../../store';
import toast from 'react-hot-toast';
import type { RoomMemberType } from '../../types';

interface AddMemberModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  roomId: string;
}

const AddMemberModal = ({ isOpen, onOpenChange, roomId }: AddMemberModalProps) => {
  const { chatStore } = useStore();
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');

const onSuccess = (member: RoomMemberType[]) => {
  toast.success(`Member added to the room`);
  onOpenChange(false);
  setUserId('');
  chatStore.setRoomMembers(roomId, member);
}


  const handleAddMember = async () => {
    if (!userId.trim()) {
      setError('User ID is required');
      return;
    }
    setError('');
    try {
      await chatStore.addRoomMember(roomId, userId, onSuccess);
      chatStore
      setUserId('');
      onOpenChange(false);

    } catch (err: Error | any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add member';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
    }
  };

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
      <ActionButton UNSAFE_style={{
        cursor: 'pointer'
      }} UNSAFE_className='!cursor-pointer'>Add Member</ActionButton>
      {(close) => (
          <div className="flex flex-col w-full p-5 gap-5">
            <div className="space-y-1">
              <Heading level={2} margin={0} UNSAFE_style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1a1a1a',
                lineHeight: '1.5'
              }}>
                Add Member
              </Heading>
              <p className="text-sm text-gray-500">
                Enter the user ID of the person you want to add
              </p>
            </div>
            
            <div className="space-y-4 grow">
              <TextField
                label=""
                value={userId}
                onChange={setUserId}
                placeholder="Enter user ID"
                isRequired
                validationState={error ? 'invalid' : undefined}
                errorMessage={error}
                isDisabled={chatStore.loading}
                width="100%"
                autoFocus
                UNSAFE_className="w-full"
               
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="secondary" 
                onPress={close}
                isDisabled={chatStore.loading}
                UNSAFE_style={{
                  minWidth: '80px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  color: '#4b5563',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor:'pointer'
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onPress={() => handleAddMember().then(close)}
                isDisabled={chatStore.loading || !userId.trim()}
                UNSAFE_style={{
                  minWidth: '100px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  outline: 'none',
                  border: 'none',
                  cursor: chatStore.loading || !userId.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {chatStore.loading ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
      )}
    </DialogTrigger>
  );
}

export default observer(AddMemberModal);
