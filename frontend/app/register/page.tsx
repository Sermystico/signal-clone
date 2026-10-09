"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, ArrowLeft, Camera, Trash2 } from "lucide-react";
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

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Step 1: Phone
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Step 2: OTP
  const [otp, setOtp] = useState("123456");
  
  // Step 3: Profile
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
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

  // Handle Avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
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
      const faceId = (cleanUsername.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 5) + 1;
      const defaultAvatar = `https://www.loremfaces.net/128/id/${faceId}.jpg`;

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          username: cleanUsername,
          display_name: cleanDisplayName,
          otp: otp.trim(),
          avatar_url: defaultAvatar,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      const token = data.access_token;

      // If user uploaded a custom avatar, upload it via /users/avatar
      if (avatarFile) {
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
            {step === 3 && "Choose how you appear to others on Signal."}
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
              className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm transition-all text-sm"
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
              className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm transition-all text-sm"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}

        {/* STEP 3: Profile Setup */}
        {step === 3 && (
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {/* Avatar Preview & Upload */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative group mb-2">
                <Avatar
                  url={avatarPreview || (username ? `https://www.loremfaces.net/128/id/${(username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 5) + 1}.jpg` : undefined)}
                  name={displayName || username || "New User"}
                  size={84}
                  className="shadow-md border-2 border-gray-100"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700 transition-colors"
                  title="Upload profile photo"
                >
                  <Camera size={14} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Remove custom photo</span>
                </button>
              )}
            </div>

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
              className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm transition-all text-sm"
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
