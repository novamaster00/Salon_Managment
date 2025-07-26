import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, MapPin, Clock, Globe } from 'lucide-react';

// Custom SVG Icons
const EmailIcon = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <polyline 
      points="22,6 12,13 2,6" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const PhoneIcon = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const WebsiteIcon = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <line 
      x1="2" 
      y1="12" 
      x2="22" 
      y2="12" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" 
      stroke="currentColor" 
      strokeWidth="2"
    />
  </svg>
);

const LinkedInIcon = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <rect 
      x="2" 
      y="9" 
      width="4" 
      height="12" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <circle 
      cx="4" 
      cy="4" 
      r="2" 
      stroke="currentColor" 
      strokeWidth="2"
    />
  </svg>
);

// New Instagram Icon for Developer Section
const InstagramIcon = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect 
      x="2" 
      y="2" 
      width="20" 
      height="20" 
      rx="5" 
      ry="5" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <path 
      d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" 
      stroke="currentColor" 
      strokeWidth="2"
    />
    <line 
      x1="17.5" 
      y1="6.5" 
      x2="17.51" 
      y2="6.5" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// New GitHub Icon for Developer Section
const GitHubIcon = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-barbershop-navy pt-16 pb-8 text-white">
      <div className="app-container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-4">
            <Link to="/" className="text-3xl font-black tracking-tight inline-block mb-4">
              <span className="text-barbershop-gold">DK-</span>
              <span className="font-light">HairSalon</span>
            </Link>
            <p className="text-gray-300 mb-6 max-w-xs leading-relaxed">
              Your premium hair salon experience with professional haircuts and expert grooming services.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-white hover:text-barbershop-gold transition-all duration-200 hover:scale-110 p-2 rounded-full hover:bg-gray-800" 
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://www.instagram.com/dk_krunal_26?igsh=MTN4bzI2cG54Z3VraA==" 
                className="text-white hover:text-barbershop-gold transition-all duration-200 hover:scale-110 p-2 rounded-full hover:bg-gray-800" 
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="#" 
                className="text-white hover:text-barbershop-gold transition-all duration-200 hover:scale-110 p-2 rounded-full hover:bg-gray-800" 
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <h3 className="text-xl font-bold mb-6 text-barbershop-gold">Services</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/appointment?service=haircut" 
                  className="text-gray-300 hover:text-barbershop-gold transition-colors hover:pl-2 duration-200"
                >
                  Haircut
                </Link>
              </li>
              <li>
                <Link 
                  to="/appointment?service=beard-trim" 
                  className="text-gray-300 hover:text-barbershop-gold transition-colors hover:pl-2 duration-200"
                >
                  Beard Trim
                </Link>
              </li>
              <li>
                <Link 
                  to="/appointment?service=haircut-and-beard-trim" 
                  className="text-gray-300 hover:text-barbershop-gold transition-colors hover:pl-2 duration-200"
                >
                  Haircut & Beard
                </Link>
              </li>
              <li>
                <Link 
                  to="/appointment?service=coloring" 
                  className="text-gray-300 hover:text-barbershop-gold transition-colors hover:pl-2 duration-200"
                >
                  Hair Coloring
                </Link>
              </li>
              <li>
                <Link 
                  to="/appointment?service=kids-haircut" 
                  className="text-gray-300 hover:text-barbershop-gold transition-colors hover:pl-2 duration-200"
                >
                  Kids Haircut
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-6 text-barbershop-gold flex items-center">
              <Clock size={20} className="mr-2" />
              Hours
            </h3>
            <ul className="text-gray-300 space-y-3">
              <li className="flex flex-col">
                <span className="text-sm">Monday - Friday:</span>
                <span className="text-barbershop-gold font-semibold">09AM - 10PM</span>
              </li>
              <li className="flex flex-col">
                <span className="text-sm">Saturday:</span>
                <span className="text-barbershop-gold font-semibold">09AM - 10PM</span>
              </li>
              <li className="flex flex-col">
                <span className="text-sm">Sunday:</span>
                <span className="text-barbershop-gold font-semibold">08AM - 11PM</span>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-3">
            <h3 className="text-xl font-bold mb-6 text-barbershop-gold flex items-center">
              <MapPin size={20} className="mr-2" />
              Contact
            </h3>
            <address className="text-gray-300 not-italic space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin size={16} className="mt-1 text-barbershop-gold flex-shrink-0" />
                <div>
                  <p>GF10, Akshar Plaza Complex</p>
                  <p>Near Padra, In front of Bus Depot</p>
                  <p>Beside Shreeji Pan</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <PhoneIcon size={16} className="text-barbershop-gold" />
                <p className="text-barbershop-gold font-semibold">(555) 123-4567</p>
              </div>
              <div className="flex items-center space-x-2">
                <EmailIcon size={16} className="text-barbershop-gold" />
                <p>valandkrunal697@gmail.com</p>
              </div>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <p className="text-gray-400 mb-4 md:mb-0 flex items-center">
              &copy; {new Date().getFullYear()} DK-HairSalon. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link 
                to="/privacy" 
                className="text-gray-400 hover:text-barbershop-gold transition-colors text-sm hover:underline"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className="text-gray-400 hover:text-barbershop-gold transition-colors text-sm hover:underline"
              >
                Terms of Service
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-400 hover:text-barbershop-gold transition-colors text-sm hover:underline"
              >
                Contact Us
              </Link>
            </div>
          </div>
          
          {/* Developer Credit Section - Integrated with Theme */}
          <div id="developer-info" className="border-t border-gray-700 pt-6 text-center">
            <div className="mb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-barbershop-gold rounded-full flex items-center justify-center mr-4">
                  <span className="text-barbershop-navy font-bold text-lg">HP</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-barbershop-gold">Harsh Parmar</h4>
                  <p className="text-gray-300 text-sm">Full Stack Developer & Designer</p>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-6 max-w-2xl mx-auto">
                Passionate about creating exceptional digital experiences. Specializing in modern web development, 
                responsive design, and user-friendly applications that drive business growth.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <a 
                  href="mailto:aiharsh00004@gmail.com?subject=Web Development Inquiry&body=Hi Harsh,%0A%0AI found your contact through the DK-HairSalon website and I'm interested in discussing a project.%0A%0A"
                 className="flex items-center justify-center space-x-2 text-barbershop-gold hover:text-white border border-barbershop-gold hover:bg-barbershop-gold px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 group font-medium"
                >
                  <EmailIcon size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">aiharsh00004@gmail.com</span>
                </a>
                
                <a 
                  href="tel:+918128943345" 
                  className="flex items-center justify-center space-x-2 text-barbershop-gold hover:text-white border border-barbershop-gold hover:bg-barbershop-gold px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 group font-medium"
                >
                  <PhoneIcon size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">+91 8128943345</span>
                </a>
                
                <a 
                  href="#portfolio" 
                  className="flex items-center justify-center space-x-2 text-barbershop-gold hover:text-white border border-barbershop-gold hover:bg-barbershop-gold px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 group font-medium"
                >
                  <WebsiteIcon size={18} className="group-hover:scale-110 transition-transform" />
                  <span>View Portfolio</span>
                </a>
              </div>
              
              <div className="flex justify-center space-x-4">
                <a 
                  href="https://www.linkedin.com/in/harsh-parmar-coumputer-engineer/" 
                  className="text-gray-300 hover:text-barbershop-gold transition-all duration-200 hover:scale-110 p-2 rounded-full hover:bg-gray-800" 
                  aria-label="LinkedIn Profile"
                >
                  <LinkedInIcon size={20} />
                </a>
                <a 
                  href="https://github.com/novamaster00" 
                  className="text-gray-300 hover:text-barbershop-gold transition-all duration-200 hover:scale-110 p-2 rounded-full hover:bg-gray-800" 
                  aria-label="GitHub Profile"
                >
                  <GitHubIcon size={20} />
                </a>
                
                <a 
                  href="https://www.instagram.com/_h_______.s_/profilecard/?igsh=bWpkOW9mbnVhaXV1" 
                  className="text-gray-300 hover:text-barbershop-gold transition-all duration-200 hover:scale-110 p-2 rounded-full hover:bg-gray-800" 
                  aria-label="Instagram Profile"
                >
                  <InstagramIcon size={20} />
                </a>
              </div>
            </div>
            
            <p className="text-gray-400 text-xs">
              Need a website or digital solution for your business? 
              <span className="text-barbershop-gold font-medium ml-1">Let's create something amazing together!</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}