import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, Worker, Manager } from '@/types/align';
import { currentWorker, currentManager } from '@/data/mockData';

interface AppContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentUser: Worker | Manager;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>('worker');

  const currentUser = userRole === 'worker' ? currentWorker : currentManager;

  return (
    <AppContext.Provider value={{ userRole, setUserRole, currentUser }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
