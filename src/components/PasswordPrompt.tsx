"use client";

import { useState } from "react";
import { Terminal, Eye, EyeOff } from "lucide-react";

interface PasswordPromptProps {
  onAuthenticated: (token: string) => void;
  currentTime: Date;
}

export function PasswordPrompt({
  onAuthenticated,
  currentTime,
}: PasswordPromptProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token in localStorage for session persistence
        localStorage.setItem("jarvis_token", data.sessionToken);
        onAuthenticated(data.sessionToken);
      } else {
        setAttempts((prev) => prev + 1);
        setError(data.error || "Authentication failed");
        setPassword("");

        // Add small delay for security
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      setError("Connection failed. Please try again.");
      console.error("Authentication error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-h-screen bg-black text-green-400 flex flex-col items-center justify-center p-14 relative overflow-hidden font-mono">
      {/* Terminal Scanlines Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.03)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

      {/* CRT Glow Effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20 pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto flex flex-col h-screen relative z-10 border border-green-500/30 bg-black/80 backdrop-blur-sm">
        {/* Terminal Header */}
        <div className="border-b border-green-500/30 p-4 flex items-center justify-between bg-green-500/5">
          <div className="flex items-center space-x-3">
            <Terminal className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-bold">JARVIS TERMINAL</span>
            <span className="text-green-300/60 text-sm">v1.1.2</span>
            <span className="text-green-300/60 text-sm">
              | AUTHENTICATION REQUIRED
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-green-300/60">
              {currentTime.toLocaleTimeString()}
            </span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-yellow-400 text-xs">LOCKED</span>
            </div>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 flex flex-col justify-center items-center p-8">
          <div className="w-full max-w-2xl space-y-6">
            {/* Boot Message */}
            <div className="space-y-2 text-green-300/80 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">JARVIS@SYSTEM:</span>
                <span>Initializing secure connection...</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">JARVIS@SYSTEM:</span>
                <span>Authentication protocol activated</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">SECURITY:</span>
                <span>Access credentials required</span>
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center space-x-2 text-green-400">
                <span className="text-green-400">JARVIS@AUTH:</span>
                <span>Enter access password:</span>
              </div>

              <div className="flex items-center space-x-2 bg-black/50 border border-green-500/30 rounded px-3 py-2">
                <span className="text-green-400">$</span>
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-green-400 outline-none font-mono placeholder-green-300/30"
                    placeholder="••••••••"
                    disabled={isVerifying}
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-green-300/60 hover:text-green-300 transition-colors"
                  disabled={isVerifying}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-400">
                  <span className="text-red-400">ERROR:</span>
                  <span>{error}</span>
                  {attempts > 0 && (
                    <span className="text-red-300/60">
                      (Attempt {attempts}/5)
                    </span>
                  )}
                </div>
              )}

              {isVerifying && (
                <div className="flex items-center space-x-2 text-yellow-400">
                  <span className="text-yellow-400">VERIFYING:</span>
                  <span>Authenticating credentials...</span>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
              )}

              <div className="text-green-300/60 text-xs space-y-1">
                <div>• Press ENTER to authenticate</div>
                <div>
                  • Contact system administrator if you have forgotten your
                  credentials
                </div>
              </div>
            </form>

            {/* Security Notice */}
            <div className="border-t border-green-500/20 pt-4 text-green-300/40 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">⚠</span>
                <span>
                  This system is protected. Unauthorized access is prohibited.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
