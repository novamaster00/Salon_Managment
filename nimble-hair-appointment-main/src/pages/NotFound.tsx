
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <Layout>
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-6xl font-bold text-barbershop-navy mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="bg-barbershop-navy hover:bg-barbershop-navy/90">
            Back to Homepage
          </Button>
        </Link>
      </div>
    </Layout>
  );
}
