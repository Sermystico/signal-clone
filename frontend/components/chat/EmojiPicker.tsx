"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Smile, ThumbsUp, Heart, Flame, Laptop, X } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'popular',
    name: 'Popular',
    icon: <Flame size={16} />,
    emojis: [
      '😀', '😂', '🤣', '😍', '🥰', '🥺', '😎', '🥳', '🤔', '🔥', 
      '❤️', '💖', '👍', '👏', '🙌', '✨', '🎉', '💯', '🚀', '👀',
      '😭', '😱', '🤫', '😴', '🤤', '🤯', '💪', '🙏', '🫡', '☕'
    ]
  },
  {
    id: 'smileys',
    name: 'Smileys & People',
    icon: <Smile size={16} />,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', 
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', 
      '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', 
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', 
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', 
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', 
      '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', 
      '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', 
      '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '💀', 
      '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'
    ]
  },
  {
    id: 'gestures',
    name: 'Gestures & Body',
    icon: <ThumbsUp size={16} />,
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', 
      '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', 
      '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', 
      '👅', '👄', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', 
      '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', 
      '👇', '☝️', '🫡', '🫠', '🫢', '🫣', '🫶', '🫱', '🫲', '🫳'
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts & Symbols',
    icon: <Heart size={16} />,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', 
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', 
      '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', 
      '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', 
      '♒', '♓', '🆔', '💯', '💢', '♨️', '❗', '❕', '❓', '❔', 
      '‼️', '⁉️', '🔅', '🔆', '⚠️', '🔱', '⚜️', '🔰', '♻️', '✅', 
      '❇️', '✳️', '❎', '🌐', '💠', '💤', '🛑', '⛔', '🚫', '⭐'
    ]
  },
  {
    id: 'objects',
    name: 'Objects & Tech',
    icon: <Laptop size={16} />,
    emojis: [
      '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '📷', '📸', '📹', 
      '🎥', '📞', '☎️', '📺', '📻', '🎙️', '⏱️', '⏰', '🔋', '🔌', 
      '💡', '🔦', '💸', '💵', '💰', '💳', '💎', '🔑', '🗝️', '🚪', 
      '🛒', '🎁', '🎈', '🎉', '🎊', '📝', '📄', '📁', '📂', '📅', 
      '📌', '📎', '✂️', '🔒', '🔔', '☕', '🍕', '🍔', '🍟', '🍺', 
      '🥂', '🍷', '🍎', '🍓', '🥑', '🍌', '⚽', '🏀', '🎮', '🚗'
    ]
  }
];

// Keyword dictionary for search
const EMOJI_KEYWORDS: Record<string, string[]> = {
  'fire flame lit hot': ['🔥', '🥵', '🌶️'],
  'heart love like red pink': ['❤️', '💖', '💗', '💓', '💕', '💞', '💘', '💝', '🥰', '😍'],
  'smile happy laugh grin joy': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊'],
  'cry sad tear sob': ['😭', '😢', '🥺', '😥', '😓', '😿'],
  'thumb up good approve yes ok': ['👍', '👌', '✅', '🆗'],
  'thumb down bad no dislike': ['👎', '❌', '🚫'],
  'cool shades glasses sunglasses': ['😎', '🕶️'],
  'party celebration celebrate yay': ['🎉', '🥳', '🎊', '🍾', '🎈'],
  'rocket launch fast space': ['🚀', '✨', '🌟', '🌕'],
  'hundred 100 perfect score': ['💯'],
  'coffee tea drink morning': ['☕', '🍵', '🧃'],
  'clap applause cheer': ['👏', '🙌'],
  'pray please thanks thank': ['🙏'],
  'computer laptop tech mac pc work': ['💻', '🖥️', '⌨️'],
  'phone call mobile iphone': ['📱', '📲', '📞', '☎️'],
  'food pizza burger cheese': ['🍕', '🍔', '🍟', '🧀'],
  'beer drink alcohol party': ['🍺', '🍻', '🥂', '🍷'],
  'money cash rich dollar': ['💰', '💵', '💸', '🤑'],
  'sleep tired snooze night': ['😴', '🥱', '💤', '😪'],
  'think wonder hmm consider': ['🤔', '🧐'],
  'shock surprise wow omg': ['😱', '🤯', '😲', '😳'],
  'wink playful tease': ['😉', '😜', '🤪', '😝']
};

export default function EmojiPicker({ onSelectEmoji, onClose }: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState<string>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matched = new Set<string>();

    for (const [keys, emojis] of Object.entries(EMOJI_KEYWORDS)) {
      if (keys.includes(q)) {
        emojis.forEach((e) => matched.add(e));
      }
    }

    EMOJI_CATEGORIES.forEach((cat) => {
      if (cat.name.toLowerCase().includes(q)) {
        cat.emojis.forEach((e) => matched.add(e));
      }
    });

    return Array.from(matched);
  }, [searchQuery]);

  const activeCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

  return (
    <div className="w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 z-50">
      {/* Header Search */}
      <div className="p-2.5 pb-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/70">
        <div className="flex-1 relative flex items-center bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-2xs">
          <Search size={14} className="text-gray-400 mr-2 flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emoji..."
            className="w-full bg-transparent text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs (only when not searching) */}
      {!searchQuery && (
        <div className="flex items-center justify-around px-2 py-1.5 border-b border-gray-100 bg-white">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              title={cat.name}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === cat.id
                  ? 'bg-blue-50 text-blue-600 shadow-2xs font-semibold'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-3 h-[240px] overflow-y-auto">
        {searchQuery ? (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Search Results ({searchResults?.length || 0})
            </div>
            {searchResults && searchResults.length > 0 ? (
              <div className="grid grid-cols-7 gap-1.5">
                {searchResults.map((emoji, idx) => (
                  <button
                    key={`${emoji}-${idx}`}
                    type="button"
                    onClick={() => onSelectEmoji(emoji)}
                    className="w-9 h-9 flex items-center justify-center text-[22px] rounded-xl hover:bg-blue-50 hover:scale-120 transition-transform active:scale-95 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[13px] text-gray-400">
                No emojis found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
              {activeCategory.name}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {activeCategory.emojis.map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  type="button"
                  onClick={() => onSelectEmoji(emoji)}
                  className="w-9 h-9 flex items-center justify-center text-[22px] rounded-xl hover:bg-blue-50 hover:scale-120 transition-transform active:scale-95 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Quick Pick / Close */}
      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
        <span>Signal Emojis</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 font-medium px-1.5 py-0.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
