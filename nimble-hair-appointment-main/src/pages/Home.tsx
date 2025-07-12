
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { ArrowRight, Clock, Scissors, Calendar, Users } from 'lucide-react';
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

const SERVICE_DURATIONS: Record<string, number> = {
  'haircut': 30,
  'haircut-and-beard-trim': 45,
  'beard-trim': 15,
  'haircut-and-styling': 60,
  'coloring': 90,
  'styling': 30,
  'kids-haircut': 20,
  'shave': 30,
  'facial': 45,
  'full-service': 90
};

const SERVICES = [
  {
    id: 'haircut',
    name: 'Haircut',
    image: '/images/HairCut.png',
  },
  {
    id: 'haircut-and-beard-trim',
    name: 'Haircut & Beard Trim',
    image: '/images/Shave.png',
  },
  {
    id: 'beard-trim',
    name: 'Beard Trim',
    image: '/images/Beard_Trim.png',
  },
  {
    id: 'haircut-and-styling',
    name: 'Haircut & Styling',
    image: '/images/Hair_styling.png',
  },
  {
    id: 'coloring',
    name: 'Coloring',
    image: '/images/coloring_hair.png',
  },
  {
    id: 'styling',
    name: 'Styling',
    image: '/images/Styling.png',
  },
  {
    id: 'kids-haircut',
    name: 'Kids Haircut',
    image: '/images/kid_hair_cut.png',
  },
  {
    id: 'shave',
    name: 'Shave',
    image: '/images/Shave.png',
  },
  {
    id: 'facial',
    name: 'Facial',
    image: '/images/Facial.png',
  },
  {
    id: 'full-service',
    name: 'Full Service',
    image: '/images/Hair_styling.png',
  },
];

export default function Home() {
  const navigate = useNavigate();

  function handleServiceClick(serviceId: string) {
    navigate({
      pathname: "/appointment",
      search: `?service=${encodeURIComponent(serviceId)}`
    });
  }

  return (
    <Layout>
      {/* Hero section with background image */}
      <div className="relative h-[500px] mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-barbershop-navy/90 to-barbershop-navy/70 z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80')" }}
        ></div>
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">
            Classic Grooming<br/>
            <span className="text-barbershop-gold">Modern Experience</span>
          </h1>
          <p className="text-xl max-w-2xl mb-10 text-center text-white/90">
            Book your next haircut appointment online or join our walk-in queue to secure your spot with our expert barbers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <Link to="/appointment" className="w-full">
              <Button className="w-full bg-barbershop-gold text-barbershop-navy hover:bg-barbershop-gold/90 font-semibold py-6 rounded-xl shadow-lg">
                <Calendar className="mr-2 h-5 w-5" />
                Book Appointment
              </Button>
            </Link>
            <Link to="/walk-in" className="w-full">
              <Button className="w-full bg-white text-barbershop-navy hover:bg-white/90 font-semibold py-6 rounded-xl shadow-lg">
                <Users className="mr-2 h-5 w-5" />
                Join Queue
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="app-container mb-16">
        {/* Services Carousel */}
        <div className="w-full mb-16 select-none">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-barbershop-navy">Our Services</h2>
            <div className="flex items-center gap-2">
              <Link to="/appointment" className="text-barbershop-gold hover:underline font-medium flex items-center">
                View all services <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <Carousel opts={{ loop: false, align: 'start' }} className="relative">
            <CarouselContent className="py-2">
              {SERVICES.map((service) => (
                <CarouselItem key={service.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 px-2">
                  <button
                    onClick={() => handleServiceClick(service.id)}
                    className="group w-full h-full rounded-3xl flex flex-col items-center transition-all duration-300 hover:translate-y-[-8px] focus:outline-none focus:ring-2 focus:ring-barbershop-gold focus:ring-offset-2"
                    type="button"
                    aria-label={service.name}
                  >
                    <div className="relative w-full aspect-square overflow-hidden rounded-2xl mb-3">
                      <div className="absolute inset-0 bg-gradient-to-t from-barbershop-navy/80 to-transparent z-10"></div>
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <span className="absolute bottom-3 left-0 right-0 text-center z-20 text-white font-semibold">
                        {service.name}
                      </span>
                      <span className="absolute top-3 right-3 z-20 bg-barbershop-gold text-barbershop-navy text-xs font-bold px-2 py-1 rounded-full flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> {SERVICE_DURATIONS[service.id]} min
                      </span>
                    </div>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <div className="flex justify-end gap-2 mt-4 pr-2">
              <CarouselPrevious className="static translate-y-0 bg-white hover:bg-barbershop-gold text-barbershop-navy hover:text-white h-9 w-9 rounded-full shadow border border-gray-200 transition" />
              <CarouselNext className="static translate-y-0 bg-white hover:bg-barbershop-gold text-barbershop-navy hover:text-white h-9 w-9 rounded-full shadow border border-gray-200 transition" />
            </div>
          </Carousel>
        </div>

        {/* Features section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow border border-gray-100">
            <div className="rounded-full bg-barbershop-gold/10 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-5">
              <Scissors className="h-8 w-8 text-barbershop-gold" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-barbershop-navy">Expert Barbers</h3>
            <p className="text-gray-600">Our skilled barbers bring years of expertise to every cut and style.</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow border border-gray-100">
            <div className="rounded-full bg-barbershop-gold/10 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-5">
              <Calendar className="h-8 w-8 text-barbershop-gold" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-barbershop-navy">Easy Booking</h3>
            <p className="text-gray-600">Book online in seconds and secure your preferred time slot.</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow border border-gray-100">
            <div className="rounded-full bg-barbershop-gold/10 p-4 w-16 h-16 flex items-center justify-center mx-auto mb-5">
              <Users className="h-8 w-8 text-barbershop-gold" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-barbershop-navy">Walk-in Queue</h3>
            <p className="text-gray-600">Join our digital queue and we'll notify you when it's your turn.</p>
          </div>
        </div>

        {/* Call to action section */}
        <div className="bg-gradient-to-r from-barbershop-navy to-barbershop-navy/80 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-3">Current Waiting Time</h3>
            <p className="text-white/80 text-lg mb-0">
              Check the current queue status before making your decision.
            </p>
          </div>
          <Link to="/queue">
            <Button className="bg-barbershop-gold hover:bg-barbershop-gold/90 text-barbershop-navy font-semibold px-8 py-6 rounded-xl shadow-md text-lg">
              View Current Queue
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
