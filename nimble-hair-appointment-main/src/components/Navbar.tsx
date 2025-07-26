import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
<<<<<<< HEAD
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
=======
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown, UserCircle } from 'lucide-react';
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
<<<<<<< HEAD
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
=======
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dashboardDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
  };

<<<<<<< HEAD
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
=======
  // Function to scroll to developer section
  const scrollToDeveloperSection = (e) => {
    e.preventDefault();
    const developerSection = document.getElementById('developer-info');
    if (developerSection) {
      developerSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Function to get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dashboardDropdownRef.current && !dashboardDropdownRef.current.contains(event.target)) {
        setIsDashboardDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
<<<<<<< HEAD
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
=======
    <>
      {/* Custom CSS for slower animation */}
      <style>{`
        @keyframes slow-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        @keyframes slow-ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .animate-slow-pulse {
          animation: slow-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-slow-ping {
          animation: slow-ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .profile-dropdown {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .profile-dropdown-item {
          transition: all 0.2s ease-in-out;
        }

        .profile-dropdown-item:hover {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          transform: translateX(2px);
        }
      `}</style>

      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="app-container py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-2xl font-bold flex items-center">
                <span className="text-barbershop-navy">DK-</span>
                <span className="text-barbershop-gold">HairSalon</span>
              </Link>
              
              {/* Developer Credit Badge - Desktop */}
              <div className="relative">
                <button
                  onClick={scrollToDeveloperSection}
                  className="block bg-gradient-to-r from-barbershop-navy to-barbershop-gold text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-slow-pulse hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  title="Click to view developer info"
                >
                  ⚡ Powered by Harsh Parmar
                </button>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-barbershop-gold rounded-full animate-slow-ping opacity-75 pointer-events-none"></div>
              </div>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/queue" className="text-gray-700 hover:text-barbershop-gold transition-colors">
                Current Queue
              </Link>
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {/* Dashboard Dropdown for Barbers/Admins */}
                  {(user?.role === 'barber' || user?.role === 'admin') && (
                    <div className="relative" ref={dashboardDropdownRef}>
                      <button 
                        className="flex items-center text-gray-700 hover:text-barbershop-gold transition-colors"
                        onClick={() => setIsDashboardDropdownOpen(!isDashboardDropdownOpen)}
                      >
                        {user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                        <ChevronDown 
                          className={`ml-1 h-4 w-4 transition-transform ${isDashboardDropdownOpen ? 'rotate-180' : ''}`} 
                        />
                      </button>
                      
                      {isDashboardDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                          <Link 
                            to="/dashboard" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setIsDashboardDropdownOpen(false)}
                          >
                            Dashboard Home
                          </Link>
                          <Link 
                            to="/working-hours" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setIsDashboardDropdownOpen(false)}
                          >
                            Working Hours
                          </Link>
                          <Link 
                            to="/blocked-slots" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setIsDashboardDropdownOpen(false)}
                          >
                            Blocked Slots
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button 
                      className="flex items-center space-x-2 text-gray-700 hover:text-barbershop-gold transition-colors group"
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    >
                      <Avatar className="h-8 w-8 border-2 border-transparent group-hover:border-barbershop-gold transition-all">
                        <AvatarFallback className="bg-gradient-to-br from-barbershop-navy to-barbershop-gold text-white text-sm font-semibold">
                          {getInitials(user?.name || user?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-barbershop-navy">
                          {user?.name || 'User'}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {user?.role}
                        </span>
                      </div>
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} 
                      />
                    </button>
                    
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 profile-dropdown rounded-lg py-2 z-20">
                        {/* Profile Header */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-gradient-to-br from-barbershop-navy to-barbershop-gold text-white font-semibold">
                                {getInitials(user?.name || user?.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
                              <p className="text-sm text-gray-500">{user?.email}</p>
                              <span className="inline-block px-2 py-1 text-xs bg-barbershop-gold/10 text-barbershop-navy rounded-full capitalize mt-1">
                                {user?.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Profile Menu Items */}
                        <div className="py-2">
                          <Link 
                            to="/profile" 
                            className="profile-dropdown-item flex items-center px-4 py-3 text-sm text-gray-700"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <User className="mr-3 h-4 w-4 text-barbershop-navy" />
                            <div>
                              <p className="font-medium">My Profile</p>
                              <p className="text-xs text-gray-500">View and edit profile</p>
                            </div>
                          </Link>
                          
                          <Link 
                            to="/profile" 
                            className="profile-dropdown-item flex items-center px-4 py-3 text-sm text-gray-700"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <Settings className="mr-3 h-4 w-4 text-barbershop-navy" />
                            <div>
                              <p className="font-medium">Account Settings</p>
                              <p className="text-xs text-gray-500">Manage your account</p>
                            </div>
                          </Link>

                          <div className="border-t border-gray-100 mt-2 pt-2">
                            <button
                              onClick={() => {
                                handleLogout();
                                setIsProfileDropdownOpen(false);
                              }}
                              className="profile-dropdown-item flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                            >
                              <LogOut className="mr-3 h-4 w-4" />
                              <div className="text-left">
                                <p className="font-medium">Sign Out</p>
                                <p className="text-xs text-red-400">Log out of your account</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                    {/* Mobile Profile Section */}
                    <div className="py-3 px-2 bg-gradient-to-r from-barbershop-navy/5 to-barbershop-gold/5 rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-barbershop-navy to-barbershop-gold text-white font-semibold">
                            {getInitials(user?.name || user?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-barbershop-navy">{user?.name || user?.email}</p>
                          <span className="text-xs bg-barbershop-gold/20 text-barbershop-navy px-2 py-1 rounded-full capitalize">
                            {user?.role}
                          </span>
                        </div>
                      </div>
                      
                      <Link 
                        to="/profile" 
                        className="flex items-center text-gray-700 hover:text-barbershop-gold transition-colors py-2 text-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <UserCircle className="mr-2 h-4 w-4" />
                        My Profile & Settings
                      </Link>
                    </div>
                    
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
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
                        >
                          Working Hours
                        </Link>
                        <Link 
                          to="/blocked-slots" 
<<<<<<< HEAD
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
=======
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
                      className="flex items-center text-left text-red-600 py-2"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
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
              
              {/* Developer info in mobile menu - Clickable */}
              <div className="mt-6 pt-3 border-t border-gray-200 text-center">
                <button
                  onClick={(e) => {
                    scrollToDeveloperSection(e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full bg-gradient-to-r from-barbershop-navy to-barbershop-gold text-white px-4 py-2 rounded-lg mx-4 mb-2 hover:shadow-xl transition-all duration-300 hover:scale-105"
                  title="View developer info"
                >
                  <p className="font-bold text-sm">⚡ DK-Salon Powered by Harsh Parmar</p>
                  <p className="text-xs opacity-90">👆 Click to view developer info</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
>>>>>>> 0011b2f (trying to add into Production ready code to Production Branch)
  );
}