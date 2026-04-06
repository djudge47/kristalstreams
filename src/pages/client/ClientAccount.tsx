import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Mail, Edit2 } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

const ClientAccount: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error('No user found');

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setProfile(data);
        setFullName(data.full_name || '');
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      if (!profile) return;

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, full_name: fullName } : null);
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-dark-200 rounded w-1/4 mb-8"></div>
        <div className="space-y-4">
          <div className="h-12 bg-dark-200 rounded"></div>
          <div className="h-12 bg-dark-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center text-gray-400">
        Profile not found
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-8">
        <User className="text-primary w-8 h-8 mr-4" />
        <h1 className="text-3xl font-bold text-white">Account Information</h1>
      </div>

      <div className="bg-dark-100 rounded-xl p-8 border border-gray-800">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email Address
            </label>
            <div className="flex items-center bg-dark-200 rounded-lg px-4 py-3">
              <Mail className="text-gray-400 w-5 h-5 mr-3" />
              <span className="text-white">{profile.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Full Name
            </label>
            {editing ? (
              <div className="flex gap-4">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="flex-1 bg-dark-200 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleUpdateProfile}
                  className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFullName(profile.full_name || '');
                  }}
                  className="bg-dark-200 hover:bg-dark-100 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-dark-200 rounded-lg px-4 py-3">
                <span className="text-white">{profile.full_name || 'Not set'}</span>
                <button
                  onClick={() => setEditing(true)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Member Since
            </label>
            <div className="bg-dark-200 rounded-lg px-4 py-3">
              <span className="text-white">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAccount;