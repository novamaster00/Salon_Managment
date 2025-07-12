
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-barbershop-navy pt-16 pb-8 text-white">
      <div className="app-container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-4">
            <Link to="/" className="text-3xl font-bold inline-block mb-4">
              <span className="text-barbershop-gold">Sharp</span>Cutz
            </Link>
            <p className="text-gray-300 mb-4 max-w-xs">
              Your premium barbershop experience with professional haircuts and expert grooming services.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-barbershop-gold transition-colors" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="text-white hover:text-barbershop-gold transition-colors" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="text-white hover:text-barbershop-gold transition-colors" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <h3 className="text-xl font-bold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link to="/appointment?service=haircut" className="text-gray-300 hover:text-barbershop-gold transition-colors">Haircut</Link></li>
              <li><Link to="/appointment?service=beard-trim" className="text-gray-300 hover:text-barbershop-gold transition-colors">Beard Trim</Link></li>
              <li><Link to="/appointment?service=haircut-and-beard-trim" className="text-gray-300 hover:text-barbershop-gold transition-colors">Haircut & Beard</Link></li>
              <li><Link to="/appointment?service=coloring" className="text-gray-300 hover:text-barbershop-gold transition-colors">Hair Coloring</Link></li>
              <li><Link to="/appointment?service=kids-haircut" className="text-gray-300 hover:text-barbershop-gold transition-colors">Kids Haircut</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold mb-4">Hours</h3>
            <ul className="text-gray-300 space-y-2">
              <li>Monday - Friday: <br /><span className="text-barbershop-gold">9AM - 8PM</span></li>
              <li>Saturday: <br /><span className="text-barbershop-gold">10AM - 6PM</span></li>
              <li>Sunday: <br /><span className="text-barbershop-gold">11AM - 4PM</span></li>
            </ul>
          </div>
          
          <div className="md:col-span-3">
            <h3 className="text-xl font-bold mb-4">Contact</h3>
            <address className="text-gray-300 not-italic space-y-2">
              <p>123 Style Street</p>
              <p>New York, NY 10001</p>
              <p className="text-barbershop-gold">(555) 123-4567</p>
              <p>info@sharpcutz.com</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} SharpCutz. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-gray-400 hover:text-barbershop-gold transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-barbershop-gold transition-colors text-sm">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-gray-400 hover:text-barbershop-gold transition-colors text-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
