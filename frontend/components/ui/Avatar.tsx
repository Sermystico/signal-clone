import React from 'react';

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export default function Avatar({ url, name, size = 40, className = "" }: AvatarProps) {
  const getInitials = (n: string) => {
    if (!n) return "?";
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size * 0.4}px`,
  };

  if (url) {
    return (
      <img 
        src={url} 
        alt={name} 
        style={style}
        className={`rounded-full object-cover bg-gray-200 flex-shrink-0 ${className}`} 
      />
    );
  }

  // Consistent background color based on name string length/char codes to make them look nice
  const colors = [
    'bg-blue-500', 'bg-teal-500', 'bg-indigo-500', 'bg-purple-500', 
    'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-emerald-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorClass = colors[Math.abs(hash) % colors.length];

  return (
    <div 
      style={style} 
      className={`flex items-center justify-center rounded-full text-white font-medium flex-shrink-0 ${colorClass} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
