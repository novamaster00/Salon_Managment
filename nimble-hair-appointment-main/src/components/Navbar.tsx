import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="app-container py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold flex items-center">
            <span className="text-barbershop-navy">Sharp</span>
            <span className="text-barbershop-gold">Cutz</span>
          </Link>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/queue" className="text-gray-700 hover:text-barbershop-gold transition-colors">
              Current Queue
            </Link>
            
            {isAuthenticated ? (
              <>
                <span className="text-barbershop-gold font-medium border-l pl-6 border-gray-200">
                  {user?.name || user?.email}
                </span>
                
                {(user?.role === 'barber' || user?.role === 'admin') && (
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      className="flex items-center text-gray-700 hover:text-barbershop-gold transition-colors"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      {user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <Link 
                          to="/dashboard" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Dashboard Home
                        </Link>
                        <Link 
                          to="/working-hours" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Working Hours
                        </Link>
                        <Link 
                          to="/blocked-slots" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Blocked Slots
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                
                <Button variant="outline" className="border-barbershop-navy text-barbershop-navy hover:bg-barbershop-navy hover:text-white" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-barbershop-navy hover:text-barbershop-gold">
                    Login
                  </Button>
                </Link>
                
                <Link to="/register">
                  <Button className="bg-barbershop-gold hover:bg-barbershop-gold/90 text-barbershop-navy">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden text-barbershop-navy p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-gray-200 mt-3">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/queue" 
                className="text-gray-700 hover:text-barbershop-gold transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Current Queue
              </Link>
              
              {isAuthenticated ? (
                <>
                  <span className="text-barbershop-gold font-medium py-2">
                    {user?.name || user?.email}
                  </span>
                  
                  {(user?.role === 'barber' || user?.role === 'admin') && (
                    <>
                      <Link 
                        to="/dashboard" 
                        className="text-gray-700 hover:text-barbershop-gold transition-colors py-2 font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                      </Link>
                      <Link 
                        to="/working-hours" 
                        className="text-gray-700 hover:text-barbershop-gold transition-colors py-2 pl-4 text-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Working Hours
                      </Link>
                      <Link 
                        to="/blocked-slots" 
                        className="text-gray-700 hover:text-barbershop-gold transition-colors py-2 pl-4 text-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Blocked Slots
                      </Link>
                    </>
                  )}
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-left text-barbershop-navy py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-700 hover:text-barbershop-gold transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="text-gray-700 hover:text-barbershop-gold transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}