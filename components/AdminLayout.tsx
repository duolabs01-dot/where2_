
import React from 'react';
import { AdminGate } from './AdminGate';
import { AdminDashboard } from './AdminDashboard';

interface AdminLayoutProps {
  onExit: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onExit }) => {
  return (
    <AdminGate onRedirect={onExit}>
      <AdminDashboard onExit={onExit} />
    </AdminGate>
  );
};
