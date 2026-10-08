import React from 'react';
import { X, Bell, Lock, PaintBucket, Smartphone, LogOut } from 'lucide-react';

interface ProfileModalProps {
  user: any;
  onClose: () => void;
  onLogout: () => void;
}

export default function ProfileModal({ user, onClose, onLogout }: ProfileModalProps) {
  if (!user) return null;

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
            <img 
              src={user.avatar_url || "https://i.pravatar.cc/150"} 
              alt="Profile" 
              className="w-24 h-24 rounded-full object-cover shadow-sm mb-4 border-4 border-white"
            />
            <h3 className="text-xl font-bold text-gray-900">{user.display_name}</h3>
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
