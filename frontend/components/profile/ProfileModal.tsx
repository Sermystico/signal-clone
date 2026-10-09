import React, { useRef } from 'react';
import { X, Bell, Lock, PaintBucket, Smartphone, LogOut, Camera, Trash2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { User } from '@/contexts/AuthContext';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onUpdateAvatar: (url: string | null) => void;
}

export default function ProfileModal({ user, onClose, onLogout, onUpdateAvatar }: ProfileModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  if (!user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch(`${API_URL}/users/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        if (res.ok) {
          const updatedUser = await res.json();
          onUpdateAvatar(updatedUser.avatar_url);
        }
      } catch (err) {
        console.error("Failed to upload avatar", err);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    try {
      const res = await fetch(`${API_URL}/users/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        onUpdateAvatar(null);
      }
    } catch (err) {
      console.error("Failed to remove avatar", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-0">
          <div className="flex flex-col items-center p-6 bg-gray-50 border-b border-gray-200">
            <div className="relative group mb-2">
              <Avatar 
                url={user.avatar_url} 
                name={user.display_name || user.username} 
                size={96} 
                className="shadow-sm border-4 border-white"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors"
                title="Change profile photo"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            {user.avatar_url && (
              <button 
                onClick={handleRemovePhoto}
                className="text-red-500 text-xs flex items-center mb-3 hover:text-red-700 transition-colors"
              >
                <Trash2 size={12} className="mr-1" /> Remove photo
              </button>
            )}

            <h3 className="text-xl font-bold text-gray-900 mt-1">{user.display_name}</h3>
            <p className="text-gray-500 text-sm">@{user.username}</p>
          </div>

          <div className="p-2">
            <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Settings</div>
            
            <SettingRow icon={<Lock size={18} />} title="Privacy" subtitle="Coming Soon" />
            <SettingRow icon={<Bell size={18} />} title="Notifications" subtitle="Coming Soon" />
            <SettingRow icon={<PaintBucket size={18} />} title="Appearance" subtitle="Coming Soon" />
            <SettingRow icon={<Smartphone size={18} />} title="Linked Devices" subtitle="Coming Soon" />
          </div>

          <div className="p-2 border-t border-gray-200 mt-2">
             <button 
                onClick={onLogout}
                className="w-full flex items-center p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} className="mr-3" />
                <span className="font-medium">Log out</span>
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Reusable setting row component
function SettingRow({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-not-allowed opacity-70 transition-colors">
      <div className="text-gray-500 mr-4">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-gray-900 font-medium text-sm">{title}</h4>
        <p className="text-gray-500 text-xs">{subtitle}</p>
      </div>
    </div>
  );
}
