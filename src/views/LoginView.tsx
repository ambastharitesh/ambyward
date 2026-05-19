import { useState } from 'react';
import { Phone, KeyRound, ArrowRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useApp } from '../router';
import { requestOtp, verifyOtp } from '../lib/api';

type LoginStep = 'phone' | 'otp';

export default function LoginView() {
  const { login, navigate } = useApp();
  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleGetOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await requestOtp(phone.trim());
      setOtp('');
      setStep('otp');
    } catch {
      // If backend is unreachable, still allow progression in demo mode
      setOtp('');
      setStep('otp');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await verifyOtp(phone.trim(), otp);
      login(result.total_points);
    } catch {
      // Fallback to demo mode when backend is unreachable
      login(32450);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-background-default">
      {/* Top brand section */}
      <div className="bg-primary-main px-6 pt-16 pb-12 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-dark flex items-center justify-center mb-4 shadow-lg">
          <span className="text-secondary-light text-2xl font-black">RL</span>
        </div>
        <h1 className="text-white text-2xl font-bold">RewardLens</h1>
        <p className="text-primary-light text-sm mt-1 text-center">
          Track and maximise your rewards
        </p>
      </div>

      <div className="flex-1 px-5 -mt-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">

          {step === 'phone' && (
            <form key="phone-form" onSubmit={handleGetOtp} className="flex flex-col gap-5">
              <div>
                <h2 className="text-text-primary text-xl font-bold">Welcome back</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Enter your phone number to continue
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-text-primary text-sm font-medium">
                  Phone Number
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3.5 focus-within:border-primary-main focus-within:ring-2 focus-within:ring-primary-light transition-all bg-background-default">
                  <Phone className="w-4 h-4 text-text-secondary flex-shrink-0" />
                  <input
                    id="phone"
                    key="phone-input"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="flex-1 bg-transparent text-text-primary text-base outline-none placeholder:text-text-secondary"
                  />
                </div>
              </div>

              {errorMsg && <p className="text-error text-sm">{errorMsg}</p>}

              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="w-full bg-primary-main text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <>Get OTP <ArrowRight className="w-4 h-4" /></>}
              </button>

              <p className="text-center text-text-secondary text-sm">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('signup')}
                  className="text-primary-main font-semibold"
                >
                  Sign up
                </button>
              </p>
            </form>
          )}

          {step === 'otp' && (
            <form key="otp-form" onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setErrorMsg(''); }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-text-primary text-xl font-bold">Verify OTP</h2>
                  <p className="text-text-secondary text-sm">
                    Sent to{' '}
                    <span className="text-primary-main font-medium">{phone || 'your number'}</span>
                  </p>
                </div>
              </div>

              <div className="bg-secondary-light/15 rounded-xl px-4 py-2.5 border border-secondary-main/20">
                <p className="text-text-secondary text-xs">
                  Demo mode: any 6-digit code works (e.g. <span className="font-mono font-bold text-text-primary">123456</span>)
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="otp" className="text-text-primary text-sm font-medium">
                  OTP Code
                </label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3.5 focus-within:border-primary-main focus-within:ring-2 focus-within:ring-primary-light transition-all bg-background-default">
                  <KeyRound className="w-4 h-4 text-text-secondary flex-shrink-0" />
                  <input
                    id="otp"
                    key="otp-input"
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 6) setOtp(val);
                    }}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="flex-1 bg-transparent text-text-primary text-base tracking-widest outline-none placeholder:text-text-secondary placeholder:tracking-normal"
                  />
                  <span className="text-text-secondary text-xs tabular-nums">{otp.length}/6</span>
                </div>
              </div>

              {errorMsg && <p className="text-error text-sm">{errorMsg}</p>}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-primary-main text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 active:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <>Login <ArrowRight className="w-4 h-4" /></>}
              </button>

              <button
                type="button"
                onClick={() => handleGetOtp({ preventDefault: () => {} } as React.FormEvent)}
                className="text-center text-primary-main text-sm font-semibold"
              >
                Resend OTP
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="pb-8" />
    </div>
  );
}
