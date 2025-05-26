import cn from 'classnames';
import { motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { FaSignOutAlt } from 'react-icons/fa';

import { useStore } from '../../store';

interface HeaderProps {
  className?: string;
}

const Header = (props: HeaderProps): React.ReactElement => {
  const { className } = props;
  const { authStore } = useStore();
  const { user, signOut } = authStore;

  return (

     <header className={cn("bg-white shadow-sm", className)}>
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
       <h1 className="text-2xl font-bold text-gray-900">ChatApp</h1>
       {user && (
         <div className="flex items-center space-x-4">
           <div className="flex items-center">
             {user.photoURL ? (
               <img
                 src={user.photoURL}
                 alt={user.displayName || 'User'}
                 className="h-8 w-8 rounded-full"
               />
             ) : (
               <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                 <span className="text-indigo-600 font-medium">
                   {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                 </span>
               </div>
             )}
             <span className="ml-2 text-sm font-medium text-gray-700">
               {user?.displayName || user?.email?.split('@')[0]}
             </span>
           </div>
           <motion.button
             onClick={signOut}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
           >
             <FaSignOutAlt className="mr-1" />
             Sign out
           </motion.button>
         </div>
       )}
     </div>
   </header>
  );
}

export default observer(Header);