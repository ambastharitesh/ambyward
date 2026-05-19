import { useState } from 'react';
import { User, Phone, ArrowRight, ChevronLeft } from 'lucide-react';
import { useApp } from '../router';

export default function SignupView() {
  const { navigate } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate('login');
  }

  return (
    <div className="flex flex-col flex-1 bg-background-default">
      <div className="bg-primary-main px-6 pt-16 pb-12 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-dark flex items-center justify-center mb-4 shadow-lg">
          <span className="text-secondary-light text-2xl font-black">RL</span>
        </div>
        <h1 className="text-white text-2xl font-bold">RewardLens</h1>
        <p className="text-primary-light text-sm mt-1 text-center">
          Create your account
        </p>
      </div>

      <div className="flex-1 px-5 -mt-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('login')}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-text-primary text-xl font-bold">Create account</h2>
                <p className="text-text-secondary text-sm">Join RewardLens today</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-text-primary text-sm font-medium">
                Full Name
              </label>
              <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3.5 focus-within:border-primary-main focus-within:ring-2 focus-within:ring-primary-light transition-all bg-background-default">
                <User className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="flex-1 bg-transparent text-text-primary text-base outline-none placeholder:text-text-secondary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-phone" className="text-text-primary text-sm font-medium">
                Phone Number
              </label>
              <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3.5 focus-within:border-primary-main focus-within:ring-2 focus-within:ring-primary-light transition-all bg-background-default">
                <Phone className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <input
                  id="signup-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="flex-1 bg-transparent text-text-primary text-base outline-none placeholder:text-text-secondary"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-main text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
            >
              Create Account
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-text-secondary text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('login')}
                className="text-primary-main font-semibold"
              >
                Log in
              </button>
            </p>
          </form>
        </div>
      </div>

      <div className="pb-8" />
    </div>
  );
}
