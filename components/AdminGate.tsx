
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

interface AdminGateProps {
  children: React.ReactNode;
  onRedirect: () => void;
}

export const AdminGate: React.FC<AdminGateProps> = ({ children, onRedirect }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthorized(false);
        onRedirect();
        return;
      }

      try {
        // Query the public.profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (error || !data) {
          throw new Error('Profile verify failed');
        }

        if (data.is_admin === true) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          onRedirect();
        }
      } catch (e) {
        console.error('Admin Gate Error:', e);
        setIsAuthorized(false);
        onRedirect();
      }
    };

    verifyAdmin();
  }, [onRedirect]);

  if (isAuthorized === null) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
};
