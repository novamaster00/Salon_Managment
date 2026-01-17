import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { forgotPassword } from '@/lib/api';


const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous states
    setErrors({});
    setMessage('');
    setIsSuccess(false);

    // Validate email
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await forgotPassword(email);
      setIsSuccess(true);
      setMessage('If an account with that email exists, we have sent a password reset link to your email address.');
    } catch (error) {
      setIsSuccess(false);
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    // Replace with your actual navigation logic
    console.log('Navigate back to login');
    // Example: navigate('/login');
  };

  const handleTryAgain = () => {
    setIsSuccess(false);
    setMessage('');
    setEmail('');
    setErrors({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #0F2745 0%, #1a3456 50%, #0a1f38 100%)'}}>
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Mail className="w-8 h-8" style={{color: '#0F2745'}} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{color: '#0F2745'}}>Forgot Password?</h1>
            <p className="text-gray-600 text-sm">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Success Message */}
          {isSuccess && message && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-green-300 text-sm font-medium">Email Sent Successfully!</p>
                <p className="text-green-200/80 text-xs mt-1">{message}</p>
                <p className="text-green-200/60 text-xs mt-2">
                  Check your spam folder if you don't see the email in your inbox.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {!isSuccess && message && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-300 text-sm font-medium">Error</p>
                <p className="text-red-200/80 text-xs mt-1">{message}</p>
              </div>
            </div>
          )}

          {/* Form */}
          {!isSuccess && (
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{color: '#0F2745'}}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmit(e as any);
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border-2 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200`}
                    style={{color: '#0F2745'}}
                    placeholder="Enter your email address"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 py-3 px-4 rounded-lg font-semibold hover:from-yellow-600 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                style={{color: '#0F2745'}}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Reset Link
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success Actions */}
          {isSuccess && (
            <div className="space-y-4">
              <button
                onClick={handleTryAgain}
                className="w-full text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:opacity-90"
                style={{backgroundColor: '#0F2745'}}
              >
                <Mail className="w-4 h-4" />
                Send to Different Email
              </button>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <button
              onClick={handleBackToLogin}
              className="inline-flex items-center gap-2 text-gray-600 hover:opacity-80 transition-all duration-200 text-sm"
              style={{color: '#666'}}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium mb-2" style={{color: '#0F2745'}}>Need Help?</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• The reset link expires in 10 minutes</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Contact support if you continue having issues</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs" style={{color: '#0F2745'}}>
          <p>DK-HairSalon • Secure Password Recovery</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;