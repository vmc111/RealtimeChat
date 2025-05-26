import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import CreateRoomModal from '../components/chat/CreateRoomModal';
import type { Room } from '../types';

interface CreateRoomControllerProps {
    className?: string;
    createRoom: (name: string, isPrivate: boolean) => Promise<Room | null>;
}

const CreateRoomController = (props: CreateRoomControllerProps): React.ReactElement => {
    const { createRoom } = props;

    const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
    const navigate = useNavigate();


    const handleCreateRoom = async (name: string, isPrivate: boolean) => {
        try {
            const newRoom = await createRoom(name, isPrivate);

            if (newRoom) {
                // Navigate to the new room
                navigate(`/chats/${newRoom.id}`, {
                    state: {
                        from: 'room-creation',
                        roomName: newRoom.name
                    }
                });
            }

            return newRoom;
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    };


    return (
        <>
            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreateRoomModalOpen(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Create Chat Room
            </motion.button>
            <CreateRoomModal
                isOpen={isCreateRoomModalOpen}
                onClose={() => setIsCreateRoomModalOpen(false)}
                onCreateRoom={handleCreateRoom}
            />
        </>
    )
}

export default CreateRoomController;