"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, ArrowLeft, Camera, Trash2, Check, Sparkles, Upload, User as UserIcon } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

const COUNTRY_CODES = [
  { code: "+91", country: "IN", name: "India (+91)" },
  { code: "+1", country: "US", name: "USA / Canada (+1)" },
  { code: "+44", country: "GB", name: "UK (+44)" },
  { code: "+61", country: "AU", name: "Australia (+61)" },
  { code: "+49", country: "DE", name: "Germany (+49)" },
  { code: "+33", country: "FR", name: "France (+33)" },
  { code: "+81", country: "JP", name: "Japan (+81)" },
  { code: "+971", country: "AE", name: "UAE (+971)" },
];

const PRESET_AVATARS = [
  { id: 1, url: "https://www.loremfaces.net/128/id/1.jpg", label: "Avatar 1" },
  { id: 2, url: "https://www.loremfaces.net/128/id/2.jpg", label: "Avatar 2" },
  { id: 3, url: "https://www.loremfaces.net/128/id/3.jpg", label: "Avatar 3" },
  { id: 4, url: "https://www.loremfaces.net/128/id/4.jpg", label: "Avatar 4" },
  { id: 5, url: "https://www.loremfaces.net/128/id/5.jpg", label: "Avatar 5" },
  { id: 6, url: "https://www.loremfaces.net/128/id/6.jpg", label: "Avatar 6" },
  { id: 7, url: "https://www.loremfaces.net/128/id/7.jpg", label: "Avatar 7" },
  { id: 8, url: "https://www.loremfaces.net/128/id/8.jpg", label: "Avatar 8" },
];

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Step 1: Phone
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Step 2: OTP
  const [otp, setOtp] = useState("123456");
  
  // Step 3: Profile & Avatar Selection
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarMode, setAvatarMode] = useState<"initials" | "preset" | "custom">("preset");
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string>(PRESET_AVATARS[0].url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const getNormalizedPhone = () => {
    const cleanDigits = phoneNumber.replace(/[^0-9]/g, "");
    return `${countryCode}${cleanDigits}`;
  };

  // Handle Step 1: Phone submission
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanDigits = phoneNumber.replace(/[^0-9]/g, "");
    if (cleanDigits.length < 5) {
      setError("Please enter a valid phone number.");
      return;
    }

    const fullPhone = getNormalizedPhone();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/check-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.exists) {
          setError("This phone number is already registered. Please log in instead.");
        } else {
          setStep(2);
        }
      } else {
        setError(data.detail || "Failed to check phone number.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp.trim()) {
      setError("Please enter the verification OTP.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: getNormalizedPhone(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(3);
      } else {
        setError(data.detail || "Invalid OTP code. Please enter 123456.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Preset Avatar selection
  const handleSelectPreset = (url: string) => {
    setSelectedPresetUrl(url);
    setAvatarMode("preset");
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle Avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setAvatarMode("custom");
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarMode("initials");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle Step 3: Complete registration
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    if (!cleanUsername) {
      setError("Username is required.");
      return;
    }
    if (!cleanDisplayName) {
      setError("Display name is required.");
      return;
    }

    setLoading(true);

    try {
      const fullPhone = getNormalizedPhone();
      
      // Determine avatar_url: preset url if preset mode, or null if initials/custom
      let initialAvatarUrl: string | null = null;
      if (avatarMode === "preset") {
        initialAvatarUrl = selectedPresetUrl;
      }

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          username: cleanUsername,
          display_name: cleanDisplayName,
          otp: otp.trim(),
          avatar_url: initialAvatarUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      const token = data.access_token;

      // If user selected custom photo, upload it via /users/avatar
      if (avatarMode === "custom" && avatarFile) {
        try {
          const formData = new FormData();
          formData.append("file", avatarFile);
          await fetch(`${API_URL}/users/avatar`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
        } catch (uploadErr) {
          console.warn("Avatar upload failed, continuing with default avatar", uploadErr);
        }
      }

      // Log in and navigate directly to chat homepage
      login(token);
    } catch (err) {
      console.error(err);
      setError("Network error occurred while saving profile.");
      setLoading(false);
    }
  };

  const currentPreviewUrl = 
    avatarMode === "initials"
      ? null
      : avatarMode === "custom" && avatarPreview 
        ? avatarPreview 
        : selectedPresetUrl;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        
        {/* Step Indicator Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => { setStep((step - 1) as 1 | 2 | 3); setError(""); }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Registration
              </span>
            )}
            <span className="text-xs font-medium text-gray-400">
              Step {step} of 3
            </span>
          </div>

          <div className="flex gap-2 mb-4">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-blue-600" : "bg-gray-200"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {step === 1 && "Enter your phone number"}
            {step === 2 && "Enter verification code"}
            {step === 3 && "Set up your profile"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 && "Signal will verify your phone number using a mock OTP."}
            {step === 2 && `We sent a mock code to ${getNormalizedPhone()}`}
            {step === 3 && "Choose an avatar or upload a custom photo for your profile."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
            <p className="font-medium">{error}</p>
            {error.toLowerCase().includes("already registered") && (
              <p className="mt-1 text-xs text-red-600">
                Already registered?{" "}
                <Link href="/login" className="font-semibold underline hover:text-red-800">
                  Sign in here
                </Link>
              </p>
            )}
          </div>
        )}

        {/* STEP 1: Phone Number */}
        {step === 1 && (
          <form onSubmit={handlePhoneSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Country & Number
              </label>
              <div className="space-y-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition-all"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code + c.country} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <input
                    type="tel"
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-sm transition-all"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    autoFocus
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Normalized full format: <span className="font-mono text-gray-600">{getNormalizedPhone()}</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm transition-all text-sm cursor-pointer"
            >
              {loading ? "Checking Number..." : "Continue"}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <KeyRound size={16} />
                <span>Mock OTP Authentication</span>
              </div>
              <p>
                Use the development OTP code: <strong className="font-mono text-sm text-blue-900">123456</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-center tracking-widest text-lg font-mono font-semibold transition-all"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm transition-all text-sm cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}

        {/* STEP 3: Profile Setup & Avatar Options */}
        {step === 3 && (
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {/* Main Avatar Preview */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative group mb-1">
                <Avatar
                  url={currentPreviewUrl}
                  name={displayName || username || "New User"}
                  size={88}
                  className="shadow-md border-3 border-white ring-2 ring-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-transform active:scale-95 cursor-pointer"
                  title="Upload custom photo"
                >
                  <Camera size={15} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {avatarMode === "custom" && avatarPreview ? (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Custom photo chosen
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Reset</span>
                  </button>
                </div>
              ) : avatarMode === "initials" ? (
                <p className="text-[11px] text-gray-500 font-medium mt-1">
                  Initials avatar (No photo)
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-1">
                  Preset avatar selected
                </p>
              )}
            </div>

            {/* Avatar Selection Option Menu */}
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 space-y-3">
              {/* Option Mode Selector Tabs */}
              <div className="flex items-center p-1 bg-gray-200/70 rounded-xl text-xs font-semibold gap-1">
                <button
                  type="button"
                  onClick={() => setAvatarMode("initials")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    avatarMode === "initials"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <UserIcon size={13} className={avatarMode === "initials" ? "text-blue-600" : ""} />
                  <span>Initials</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarMode("preset")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    avatarMode === "preset"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Sparkles size={13} className={avatarMode === "preset" ? "text-blue-600" : ""} />
                  <span>Presets</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarMode("custom");
                    if (!avatarFile) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    avatarMode === "custom"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Upload size={13} className={avatarMode === "custom" ? "text-blue-600" : ""} />
                  <span>Upload</span>
                </button>
              </div>

              {/* Tab 1: Initials Mode View */}
              {avatarMode === "initials" && (
                <div className="pt-1">
                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                    <Avatar
                      url={null}
                      name={displayName || username || "New User"}
                      size={42}
                      className="rounded-full shadow-2xs flex-shrink-0"
                    />
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        Initials Avatar (No Photo)
                      </p>
                      <p className="text-[11px] text-gray-500 leading-snug">
                        Your profile will automatically display your colorful initials.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Preset Avatars Grid */}
              {avatarMode === "preset" && (
                <div className="pt-1">
                  <div className="grid grid-cols-4 gap-2.5 justify-items-center">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = selectedPresetUrl === preset.url && avatarMode === "preset";
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset.url)}
                          className={`relative group rounded-full p-0.5 transition-all cursor-pointer focus:outline-none ${
                            isSelected
                              ? "ring-2 ring-blue-600 scale-105"
                              : "hover:scale-105 opacity-80 hover:opacity-100"
                          }`}
                          title={preset.label}
                        >
                          <Avatar
                            url={preset.url}
                            name={preset.label}
                            size={44}
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

              {/* Tab 3: Custom Photo Upload Box */}
              {avatarMode === "custom" && (
                <div className="pt-1">
                  {avatarPreview ? (
                    <div className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          url={avatarPreview}
                          name="Custom Photo"
                          size={38}
                          className="rounded-full border border-gray-200"
                        />
                        <div className="text-left">
                          <p className="text-xs font-semibold text-gray-800 truncate max-w-[160px]">
                            {avatarFile?.name || "Custom image"}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {avatarFile ? `${(avatarFile.size / 1024).toFixed(1)} KB` : "Selected"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white/70 hover:bg-blue-50/30 group"
                    >
                      <Upload size={22} className="mx-auto text-gray-400 group-hover:text-blue-600 mb-1 transition-colors" />
                      <p className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
                        Click to upload your image
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        PNG, JPG, JPEG, GIF or WEBP
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Display Name & Username fields */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-sm transition-all"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Charlie Kelly"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Unique Username
              </label>
              <input
                type="text"
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-sm transition-all lowercase"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                placeholder="e.g. charlie"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm transition-all text-sm cursor-pointer"
            >
              {loading ? "Creating Account..." : "Complete Registration"}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm">
          <span className="text-gray-500">Already have an account? </span>
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            Log in here
          </Link>
        </div>

      </div>
    </div>
  );
}
