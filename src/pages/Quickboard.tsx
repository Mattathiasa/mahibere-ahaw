import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Quickboard() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="p-8 text-center text-muted-foreground">
      Redirecting to Dashboard...
    </div>
  );
}
