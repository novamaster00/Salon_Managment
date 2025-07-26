import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../lib/api'; // Import from your API file

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<string>('Verifying...');
  const [success, setSuccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = searchParams.get('token');
    console.log("Received token from URL:", token);
    
    if (!token) {
      setStatus('Invalid or missing verification token');
      setSuccess(false);
      setIsLoading(false);
      return;
    }

    // Use your API function instead of axios directly
    verifyEmail(token)
      .then((response) => {
        console.log('Verification successful:', response);
        if (response.success) {
          setStatus('✅ Email already verified! You can now log in.');
        } else {
          setStatus('✅ Email verified successfully! You can now log in.');
        }
        setSuccess(true);
      })
      .catch((error) => {
        console.error('Verification failed:', error);
        setStatus(error.message || '❌ Verification failed');
        setSuccess(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-md w-full">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Email Verification</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : null}
        
        <p className={`text-lg mb-4 ${
          success === null ? 'text-gray-600' : 
          success ? 'text-green-600' : 'text-red-600'
        }`}>
          {status}
        </p>
        
        {success && (
          <Link 
            to="/login" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        )}
        
        {success === false && (
          <Link 
            to="/register" 
            className="inline-block bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Register
          </Link>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;