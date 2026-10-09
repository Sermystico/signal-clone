"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Phone, ShieldCheck } from "lucide-react";

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

export default function LoginPage() {
  const [tab, setTab] = useState<"username" | "phone">("username");
  
  // Option A state
  const [identifier, setIdentifier] = useState("");
  
  // Option B state
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // OTP state
  const [otp, setOtp] = useState("123456");
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let endpoint = `${API_URL}/auth/login`;
      let payload: Record<string, string> = {};

      if (tab === "username") {
        if (!identifier.trim()) {
          setError("Please enter your username or display name.");
          setLoading(false);
          return;
        }
        payload = {
          identifier: identifier.trim(),
          otp: otp.trim(),
        };
      } else {
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
        if (!cleanPhone) {
          setError("Please enter a valid phone number.");
          setLoading(false);
          return;
        }
        const fullPhone = `${countryCode}${cleanPhone}`;
        endpoint = `${API_URL}/auth/login/phone`;
        payload = {
          phone: fullPhone,
          otp: otp.trim(),
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.access_token);
      } else {
        setError(data.detail || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error occurred. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 text-blue-600 rounded-full mb-3 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome to Signal</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in with your account or phone number</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setTab("username"); setError(""); }}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
              tab === "username"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <User size={16} />
            <span>Username / Name</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab("phone"); setError(""); }}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
              tab === "phone"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Phone size={16} />
            <span>Phone Number</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
            <p className="font-medium">{error}</p>
            {error.toLowerCase().includes("not found") && (
              <p className="mt-1 text-xs text-red-600">
                Don&apos;t have an account yet?{" "}
                <Link href="/register" className="font-semibold underline hover:text-red-800">
                  Register here
                </Link>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {tab === "username" ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Username or Display Name
              </label>
              <input
                type="text"
                required
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-sm transition-all"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. alice or Alice"
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-36 px-2.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition-all"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code + c.country} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  required
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-sm transition-all"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 9876500001"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Verification OTP
              </label>
              <span className="text-[11px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                Mock OTP: 123456
              </span>
            </div>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 text-sm tracking-widest transition-all"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-sm transition-all text-sm"
          >
            {loading ? "Verifying & Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm">
          <span className="text-gray-500">Don&apos;t have an account? </span>
          <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            Register with Phone
          </Link>
        </div>
      </div>
    </div>
  );
}
