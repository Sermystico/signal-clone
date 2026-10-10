import React, { useState, useRef } from 'react';
import {
  X,
  User as UserIcon,
  Heart,
  Settings as SettingsIcon,
  Sun,
  MessageSquare,
  Phone,
  Bell,
  Lock,
  HardDrive,
  RefreshCw,
  LogOut,
  Pencil,
  MoreHorizontal,
  AtSign,
  Trash2,
  Camera,
  Sparkles,
  Upload,
  Check,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { User } from '@/contexts/AuthContext';

const PRESET_AVATARS = [
  { id: 1, url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Felix&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf', label: 'Felix' },
  { id: 2, url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Aneka&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf', label: 'Aneka' },
  { id: 3, url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Milo&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf', label: 'Milo' },
  { id: 4, url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Bella&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf', label: 'Bella' },
  { id: 5, url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Leo&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf', label: 'Leo' },
  { id: 6, url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Zoe&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf', label: 'Zoe' },
  { id: 7, url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Jasper&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf', label: 'Jasper' },
  { id: 8, url: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Maya&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf', label: 'Maya' },
];

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onUpdateAvatar: (url: string | null) => void;
}

type SettingsSection =
  | 'profile'
  | 'account'
  | 'donate'
  | 'general'
  | 'appearance'
  | 'chats'
  | 'calls'
  | 'notifications'
  | 'privacy'
  | 'data'
  | 'backups';

export default function ProfileModal({ user, onClose, onLogout, onUpdateAvatar }: ProfileModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user.display_name || user.username || '');
  const [aboutText, setAboutText] = useState('Available');
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'initials' | 'presets' | 'upload'>('presets');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  if (!user) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSelectPreset = async (url: string | null) => {
    try {
      const res = await fetch(`${API_URL}/users/avatar`, {
        method: url ? 'PUT' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        ...(url ? { body: JSON.stringify({ avatar_url: url }) } : {}),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        onUpdateAvatar(updatedUser.avatar_url);
        showToast(url ? 'Profile avatar updated' : 'Profile photo removed');
      } else {
        showToast('Failed to update avatar');
      }
    } catch (err) {
      console.error('Failed to update avatar preset', err);
      showToast('Failed to update avatar');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch(`${API_URL}/users/avatar`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });
        if (res.ok) {
          const updatedUser = await res.json();
          onUpdateAvatar(updatedUser.avatar_url);
          showToast('Profile photo updated');
          setShowAvatarPicker(false);
        }
      } catch (err) {
        console.error('Failed to upload avatar', err);
        showToast('Failed to upload avatar');
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    await handleSelectPreset(null);
  };

  const navItems: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: 'account', label: 'Account', icon: <UserIcon size={18} /> },
    { id: 'donate', label: 'Donate to Signal', icon: <Heart size={18} /> },
    { id: 'general', label: 'General', icon: <SettingsIcon size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Sun size={18} /> },
    { id: 'chats', label: 'Chats', icon: <MessageSquare size={18} /> },
    { id: 'calls', label: 'Calls', icon: <Phone size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'privacy', label: 'Privacy', icon: <Lock size={18} /> },
    { id: 'data', label: 'Data usage', icon: <HardDrive size={18} /> },
    { id: 'backups', label: 'Backups', icon: <RefreshCw size={18} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex bg-[#F7F7F7] text-gray-900 select-none animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-gray-900/90 text-white text-[13px] font-medium px-4 py-2 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-2 pointer-events-none">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR: Settings Navigation */}
      <div className="w-full md:w-[320px] lg:w-[360px] bg-[#F7F7F7] border-r border-gray-200 flex flex-col h-full flex-shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h1 className="text-[20px] font-bold text-gray-900">Settings</h1>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-600 transition-colors focus:outline-none"
            title="Close settings"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="px-4 py-2">
          <div
            onClick={() => setActiveSection('profile')}
            className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-colors ${
              activeSection === 'profile'
                ? 'bg-[#E5E5E5] shadow-2xs'
                : 'hover:bg-gray-200/70'
            }`}
          >
            <Avatar
              url={user.avatar_url}
              name={user.display_name || user.username}
              size={48}
              className="border border-gray-200/50"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-bold text-gray-900 truncate leading-snug">
                {user.display_name || user.username}
              </h2>
              <p className="text-[13px] text-gray-500 truncate leading-snug">
                {user.phone || `@${user.username}`}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
          {navItems.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx === 2 && <div className="h-2" />}
              <button
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors cursor-pointer text-left ${
                  activeSection === item.id
                    ? 'bg-[#E5E5E5] text-gray-900'
                    : 'text-gray-700 hover:bg-gray-200/70'
                }`}
              >
                <span className="text-gray-600">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-gray-200/70">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* RIGHT PANE: Selected Setting View */}
      <div className="hidden md:flex flex-1 bg-white flex-col h-full overflow-y-auto items-center p-8">
        {activeSection === 'profile' ? (
          <div className="w-full max-w-[480px] flex flex-col items-center pt-2">
            {/* Title */}
            <h2 className="text-[16px] font-semibold text-gray-800 mb-6">Profile</h2>

            {/* Avatar & Edit Photo */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
                <Avatar
                  url={user.avatar_url}
                  name={user.display_name || user.username}
                  size={96}
                  className="border-3 border-white ring-2 ring-gray-200 shadow-sm object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAvatarPicker(true);
                  }}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-transform active:scale-95 cursor-pointer"
                  title="Change profile avatar"
                >
                  <Camera size={15} />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="text-[13px] font-medium text-gray-800 bg-[#EFEFEF] hover:bg-gray-200 px-3.5 py-1 rounded-full transition-colors cursor-pointer"
                >
                  Change avatar
                </button>

                {user.avatar_url && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-[12px] text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer px-2 py-1 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Avatar Picker Modal */}
            {showAvatarPicker && (
              <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[16px] font-bold text-gray-900">Change Profile Photo</h3>
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(false)}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center p-1 bg-gray-100 rounded-xl text-xs font-semibold mb-4 gap-1">
                    <button
                      type="button"
                      onClick={() => setAvatarTab('initials')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        avatarTab === 'initials'
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <UserIcon size={13} className={avatarTab === 'initials' ? 'text-blue-600' : ''} />
                      <span>Initials</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarTab('presets')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        avatarTab === 'presets'
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Sparkles size={13} className={avatarTab === 'presets' ? 'text-blue-600' : ''} />
                      <span>Presets</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarTab('upload');
                        fileInputRef.current?.click();
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        avatarTab === 'upload'
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Upload size={13} className={avatarTab === 'upload' ? 'text-blue-600' : ''} />
                      <span>Upload</span>
                    </button>
                  </div>

                  {/* Tab 1: Initials Mode */}
                  {avatarTab === 'initials' && (
                    <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Avatar
                        url={null}
                        name={displayName || user.display_name || user.username}
                        size={64}
                        className="shadow-sm mb-3"
                      />
                      <p className="text-xs font-semibold text-gray-800">Use Name Initials</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 mb-3.5">
                        Display your colorful initials avatar instead of a photo.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleSelectPreset(null);
                          setShowAvatarPicker(false);
                        }}
                        className="w-full py-2 px-3 bg-blue-600 text-white text-xs font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                      >
                        Apply Initials Avatar
                      </button>
                    </div>
                  )}

                  {/* Tab 2: Presets (OpenPeeps) */}
                  {avatarTab === 'presets' && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-gray-500 text-center">
                        Select an OpenPeeps avatar character:
                      </p>
                      <div className="grid grid-cols-4 gap-2.5 justify-items-center p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        {PRESET_AVATARS.map((preset) => {
                          const isSelected = user.avatar_url === preset.url;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={async () => {
                                await handleSelectPreset(preset.url);
                              }}
                              className={`relative group rounded-full p-0.5 transition-all cursor-pointer focus:outline-none ${
                                isSelected
                                  ? 'ring-2 ring-blue-600 scale-105'
                                  : 'hover:scale-105 opacity-85 hover:opacity-100'
                              }`}
                              title={preset.label}
                            >
                              <Avatar
                                url={preset.url}
                                name={preset.label}
                                size={46}
                                className="rounded-full shadow-2xs"
                              />
                              {isSelected && (
                                <span className="absolute -bottom-0.5 -right-0.5 bg-blue-600 text-white rounded-full p-0.5 shadow-sm border border-white">
                                  <Check size={10} strokeWidth={3} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Upload Custom Photo */}
                  {avatarTab === 'upload' && (
                    <div className="space-y-3">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-gray-50 hover:bg-blue-50/30 group"
                      >
                        <Upload size={24} className="mx-auto text-gray-400 group-hover:text-blue-600 mb-1.5 transition-colors" />
                        <p className="text-xs font-semibold text-gray-700 group-hover:text-blue-700">
                          Click to select a file from device
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Supports PNG, JPG, JPEG, GIF or WEBP
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Info Card 1: Display Name & About */}
            <div className="w-full bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs">
              {/* Display Name Row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                <UserIcon size={18} className="text-gray-500 flex-shrink-0" />
                {isEditingName ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    autoFocus
                    className="flex-1 text-[15px] font-medium text-gray-900 bg-transparent border-none focus:outline-none"
                  />
                ) : (
                  <span
                    onClick={() => setIsEditingName(true)}
                    className="flex-1 text-[15px] font-medium text-gray-900 cursor-pointer"
                  >
                    {displayName || user.display_name || user.username}
                  </span>
                )}
              </div>

              {/* About Row */}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <Pencil size={18} className="text-gray-500 flex-shrink-0" />
                {isEditingAbout ? (
                  <input
                    type="text"
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    onBlur={() => setIsEditingAbout(false)}
                    autoFocus
                    className="flex-1 text-[15px] text-gray-700 bg-transparent border-none focus:outline-none"
                  />
                ) : (
                  <span
                    onClick={() => setIsEditingAbout(true)}
                    className="flex-1 text-[15px] text-gray-700 cursor-pointer"
                  >
                    {aboutText}
                  </span>
                )}
              </div>
            </div>

            {/* Card 1 Subtext */}
            <p className="w-full text-[12.5px] text-gray-500 mt-2 px-1 leading-relaxed">
              Your profile and changes to it will be visible to people you message, contacts and groups.
            </p>

            {/* Profile Info Card 2: Username */}
            <div className="w-full bg-white border border-gray-200/90 rounded-2xl px-4 py-3.5 mt-6 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <AtSign size={18} className="text-gray-500" />
                <span className="text-[15px] font-medium text-gray-900">
                  {user.username}
                </span>
              </div>
              <button
                type="button"
                onClick={() => showToast('Username settings - Coming Soon')}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal size={18} />
              </button>
            </div>

            {/* Card 2 Subtext */}
            <p className="w-full text-[12.5px] text-gray-500 mt-2 px-1 leading-relaxed">
              People can now message you using your optional username so you don&apos;t have to give out your phone number.
            </p>
          </div>
        ) : (
          /* Placeholder Details for other sections */
          <div className="w-full max-w-[480px] flex flex-col items-center pt-6 text-center">
            <h2 className="text-[18px] font-bold text-gray-900 mb-2 capitalize">
              {activeSection.replace('_', ' ')}
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 w-full mt-4 flex flex-col items-center">
              <span className="text-gray-400 mb-3">
                {navItems.find((n) => n.id === activeSection)?.icon}
              </span>
              <h3 className="text-[15px] font-semibold text-gray-800">
                {navItems.find((n) => n.id === activeSection)?.label} Settings
              </h3>
              <p className="text-[13px] text-gray-500 mt-1">
                This configuration panel is coming soon in the next Signal update.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
