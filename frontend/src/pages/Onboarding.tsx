import { useState } from 'react';
import { useNavigate } from '../lib/router';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, Eye } from 'lucide-react';
import { useCase } from '../lib/context/CaseContext';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export function Onboarding() {
  const navigate = useNavigate();
  const [selectedState, setSelectedState] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setStateFilter } = useCase() as any; // We will add this to context

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedState) return;
    
    setIsSubmitting(true);
    if (setStateFilter) {
      setStateFilter(selectedState);
    } else {
      sessionStorage.setItem('user_state', selectedState);
    }

    setTimeout(() => {
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-brand-900 p-6">
      <div className="absolute inset-0 z-0">
        <img src="/images/hero2.jpeg" className="h-full w-full object-cover opacity-20 mix-blend-luminosity" alt="Background" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-900/80 to-brand-900/50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="bg-brand-50 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
            <MapPin className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Where do you live?</h1>
          <p className="mt-2 text-sm text-muted">
            Select your state to discover localized schemes tailored for you alongside national benefits.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-700">Select State/UT</label>
              <select 
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface p-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                required
              >
                <option value="" disabled>Choose your state...</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={!selectedState || isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
