
import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { login, loading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLocalError('');
    clearError();

    try {
      await login(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed');
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-black flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full scale-150 transform -translate-x-1/4">
            <path d="M 20 50 Q 50 10 80 50 Q 50 90 20 50" fill="white" />
          </svg>
        </div>

        <div className="z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center font-black text-black text-[28px]">J</div>
            <h1 className="text-white text-[24px] font-bold tracking-tight">Jiveesha ECD Platform</h1>
          </div>
          <div className="space-y-1">
            <h2 className="text-[16px] text-[#AAAAAA] font-medium uppercase tracking-widest">State Commissioner Office</h2>
            <p className="text-[13px] text-[#555555] font-medium">Government of Andhra Pradesh</p>
          </div>
        </div>

        <div className="z-10 mt-auto">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-[#333]" />
            <p className="text-[#333] text-[12px] uppercase font-bold tracking-[0.2em]">Tier 5 State-Level Access</p>
          </div>
          <p className="text-[#AAAAAA] text-[14px] leading-relaxed max-w-md">
            Secured end-to-end monitoring for statewide early childhood interventions. Authorized personnel only. Access is logged and monitored.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[420px]">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
              <h2 className="text-[28px] font-semibold text-black mb-1">Sign In</h2>
              <p className="text-[14px] text-[#888888]">State Executive Access Portal</p>
            </div>

            {displayError && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle size={18} className="text-red-500 shrink-0" />
                <p className="text-[13px] text-red-700 font-medium">{displayError}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#555] uppercase tracking-tight">Email Address</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@ap.gov.in"
                    className="w-full h-12 border border-[#E5E5E5] px-4 rounded focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-[14px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[12px] font-bold text-[#555] uppercase tracking-tight">Password</label>
                    <button type="button" className="text-[11px] font-semibold text-[#888] hover:text-black transition-colors">Forgot Password?</button>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 border border-[#E5E5E5] px-4 rounded focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-[14px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888] hover:text-black transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-black text-white font-bold rounded flex items-center justify-center gap-2 hover:bg-[#222] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    'Sign In to Dashboard'
                  )}
                </button>

                <div className="flex items-center gap-2 px-1">
                  <input type="checkbox" id="remember" className="rounded border-[#E5E5E5] text-black focus:ring-black cursor-pointer" />
                  <label htmlFor="remember" className="text-[13px] text-[#555] cursor-pointer select-none">Remember this device</label>
                </div>
              </div>
            </form>

            <div className="pt-12 border-t border-[#F5F5F5] text-center">
              <p className="text-[12px] text-[#AAAAAA] leading-relaxed">
                By signing in, you agree to the Government of Andhra Pradesh data security and privacy policies.
                <br />
                <button className="font-semibold text-[#888] hover:text-black mt-2 underline decoration-[#E5E5E5] underline-offset-4">Contact IT Admin for Access</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
