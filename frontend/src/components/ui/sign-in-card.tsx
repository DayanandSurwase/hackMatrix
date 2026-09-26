import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeClosed, ArrowRight, X, User } from 'lucide-react';
import { Link, useNavigate } from '../../lib/router';
import { cx } from './index';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cx(
        'flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow]',
        'placeholder:text-white/30 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:ring-[3px]',
        className,
      )}
      {...props}
    />
  );
}

export function SignInCard() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/onboarding');
    }, 1400);
  };

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const images = ['/images/hero1.jpeg', '/images/hero2.jpeg'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-black">
      {/* Full Screen Image Carousel */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentImageIndex}
            src={images[currentImageIndex]}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0 h-full w-full object-cover"
            alt="Background"
          />
        </AnimatePresence>
        {/* Subtle overlay for text readability only */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />
      </div>
        
      {/* Top Navbar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between p-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/logo-final-3.jpeg" alt="Logo" className="h-10 w-10 rounded-xl object-cover shadow-lg" />
          <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-md">SchemeGuide</h2>
        </Link>
        <div className="flex items-center gap-4">
          <button onClick={() => { setAuthMode('signin'); setIsModalOpen(true); }} className="text-sm font-semibold text-white drop-shadow-md transition hover:text-emerald-300">
            Sign in
          </button>
          <button onClick={() => { setAuthMode('signup'); setIsModalOpen(true); }} className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-400">
            Sign up
          </button>
        </div>
      </div>

      {/* Titles over the image */}
      <div className="absolute bottom-1/4 left-0 right-0 z-10 px-6 text-center lg:bottom-1/3">
        <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-5xl xl:text-6xl">SchemeGuide</h1>
        <p className="mx-auto mt-4 max-w-lg text-base font-medium text-emerald-50 drop-shadow-md sm:text-lg">
          Financial Policy Discovery &amp; Application Assistant
        </p>
      </div>

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-6 backdrop-blur-md"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-2 text-white/60 transition hover:bg-white/20 hover:text-white"
            >
              <X size={20} />
            </button>
            
            {/* The Glass Auth Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, type: 'spring', bounce: 0.4 }}
              className="relative w-full max-w-sm"
              style={{ perspective: 1500 }}
            >
              <motion.div
                style={{ rotateX, rotateY }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                whileHover={{ z: 10 } as any}
                className="relative"
              >
                <div className="group relative">
            {/* Animated border glow */}
            <motion.div
              className="absolute -inset-[1px] rounded-2xl opacity-20"
              animate={{
                boxShadow: [
                  '0 0 10px 2px rgba(255,255,255,0.03)',
                  '0 0 15px 5px rgba(255,255,255,0.05)',
                  '0 0 10px 2px rgba(255,255,255,0.03)',
                ],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
            />

            {/* Traveling light beams */}
            <div className="absolute -inset-[1px] overflow-hidden rounded-2xl">
              {/* Top beam */}
              <motion.div
                className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                animate={{ left: ['-50%', '100%'], opacity: [0.3, 0.7, 0.3], filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'] }}
                transition={{
                  left: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror' },
                  filter: { duration: 1.5, repeat: Infinity, repeatType: 'mirror' },
                }}
              />
              {/* Right beam */}
              <motion.div
                className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                animate={{ top: ['-50%', '100%'], opacity: [0.3, 0.7, 0.3], filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'] }}
                transition={{
                  top: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 0.6 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 0.6 },
                  filter: { duration: 1.5, repeat: Infinity, repeatType: 'mirror', delay: 0.6 },
                }}
              />
              {/* Bottom beam */}
              <motion.div
                className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                animate={{ right: ['-50%', '100%'], opacity: [0.3, 0.7, 0.3], filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'] }}
                transition={{
                  right: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.2 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 1.2 },
                  filter: { duration: 1.5, repeat: Infinity, repeatType: 'mirror', delay: 1.2 },
                }}
              />
              {/* Left beam */}
              <motion.div
                className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                animate={{ bottom: ['-50%', '100%'], opacity: [0.3, 0.7, 0.3], filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'] }}
                transition={{
                  bottom: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.8 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 1.8 },
                  filter: { duration: 1.5, repeat: Infinity, repeatType: 'mirror', delay: 1.8 },
                }}
              />

              {/* Corner sparks */}
              {[
                { pos: 'top-0 left-0', size: 'h-[5px] w-[5px]', op: 0.4, dur: 2, delay: 0 },
                { pos: 'top-0 right-0', size: 'h-[8px] w-[8px]', op: 0.6, dur: 2.4, delay: 0.5 },
                { pos: 'bottom-0 right-0', size: 'h-[8px] w-[8px]', op: 0.6, dur: 2.2, delay: 1 },
                { pos: 'bottom-0 left-0', size: 'h-[5px] w-[5px]', op: 0.4, dur: 2.3, delay: 1.5 },
              ].map(({ pos, size, op, dur, delay }) => (
                <motion.div
                  key={pos}
                  className={cx('absolute rounded-full blur-[2px]', size, pos)}
                  style={{ backgroundColor: `rgba(255,255,255,${op})` }}
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: dur, repeat: Infinity, repeatType: 'mirror', delay }}
                />
              ))}
            </div>

            {/* Glass card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
              {/* Inner grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)',
                  backgroundSize: '30px 30px',
                }}
              />

              {/* Header */}
              <div className="mb-5 space-y-1 text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="relative mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 shadow-lg"
                >
                  <img src="/images/logo-final-3.jpeg" alt="Logo" className="h-full w-full object-cover" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-xl font-bold text-transparent"
                >
                  {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs text-white/60"
                >
                  {authMode === 'signin' ? 'Sign in to continue to SchemeGuide' : 'Join SchemeGuide to discover benefits'}
                </motion.p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <AnimatePresence>
                    {authMode === 'signup' && (
                      <motion.div
                        className={cx('relative', focusedInput === 'name' ? 'z-10' : '')}
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                          <User
                            className={cx(
                              'absolute left-3 h-4 w-4 transition-all duration-300',
                              focusedInput === 'name' ? 'text-white' : 'text-white/40',
                            )}
                          />
                          <Input
                            type="text"
                            placeholder="Full Name"
                            onFocus={() => setFocusedInput('name')}
                            onBlur={() => setFocusedInput(null)}
                            className="w-full border-transparent bg-white/5 pl-10 pr-3 text-white transition-all duration-300 placeholder:text-white/30 focus-visible:border-white/20 focus-visible:bg-white/10 focus-visible:ring-white/10"
                            required
                          />
                          {focusedInput === 'name' && (
                            <motion.div
                              layoutId="input-highlight"
                              className="absolute inset-0 -z-10 bg-white/5"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <motion.div
                    className={cx('relative', focusedInput === 'email' ? 'z-10' : '')}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Mail
                        className={cx(
                          'absolute left-3 h-4 w-4 transition-all duration-300',
                          focusedInput === 'email' ? 'text-white' : 'text-white/40',
                        )}
                      />
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full border-transparent bg-white/5 pl-10 pr-3 text-white transition-all duration-300 placeholder:text-white/30 focus-visible:border-white/20 focus-visible:bg-white/10 focus-visible:ring-white/10"
                      />
                      {focusedInput === 'email' && (
                        <motion.div
                          layoutId="input-highlight"
                          className="absolute inset-0 -z-10 bg-white/5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    className={cx('relative', focusedInput === 'password' ? 'z-10' : '')}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Lock
                        className={cx(
                          'absolute left-3 h-4 w-4 transition-all duration-300',
                          focusedInput === 'password' ? 'text-white' : 'text-white/40',
                        )}
                      />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full border-transparent bg-white/5 pl-10 pr-10 text-white transition-all duration-300 placeholder:text-white/30 focus-visible:border-white/20 focus-visible:bg-white/10 focus-visible:ring-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <Eye className="h-4 w-4 text-white/40 transition-colors duration-300 hover:text-white" />
                        ) : (
                          <EyeClosed className="h-4 w-4 text-white/40 transition-colors duration-300 hover:text-white" />
                        )}
                      </button>
                      {focusedInput === 'password' && (
                        <motion.div
                          layoutId="input-highlight"
                          className="absolute inset-0 -z-10 bg-white/5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Remember + forgot */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="h-4 w-4 appearance-none rounded border border-white/20 bg-white/5 transition-all duration-200 checked:border-white checked:bg-white focus:outline-none focus:ring-1 focus:ring-white/30"
                      />
                      {rememberMe && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="pointer-events-none absolute inset-0 flex items-center justify-center text-black"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                    <label htmlFor="remember-me" className="text-xs text-white/60 transition-colors duration-200 hover:text-white/80">
                      Remember me
                    </label>
                  </div>

                  <Link to="/dashboard" className="text-xs text-white/60 transition-colors duration-200 hover:text-white">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="group/button relative mt-5 w-full"
                >
                  <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 blur-lg transition-opacity duration-300 group-hover/button:opacity-70" />
                  <div className="relative flex h-10 items-center justify-center overflow-hidden rounded-lg bg-white font-medium text-black transition-all duration-300">
                    <motion.div
                      className="absolute inset-0 -z-10 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
                      style={{ opacity: isLoading ? 1 : 0, transition: 'opacity 0.3s ease' }}
                    />
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/70 border-t-transparent" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1 text-sm font-medium"
                        >
                          {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/button:translate-x-1" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                {/* Divider */}
                <div className="relative mb-5 mt-2 flex items-center">
                  <div className="flex-grow border-t border-white/5" />
                  <motion.span
                    className="mx-3 text-xs text-white/40"
                    animate={{ opacity: [0.7, 0.9, 0.7] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    or
                  </motion.span>
                  <div className="flex-grow border-t border-white/5" />
                </div>

                {/* Google */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="group/google relative w-full"
                >
                  <div className="absolute inset-0 rounded-lg bg-white/5 opacity-0 blur transition-opacity duration-300 group-hover/google:opacity-70" />
                  <div className="relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-lg border border-white/10 bg-white/5 font-medium text-white transition-all duration-300 hover:border-white/20">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-xs text-white/80 transition-colors duration-300 group-hover/google:text-white">
                      {authMode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 1, ease: 'easeInOut' }}
                    />
                  </div>
                </motion.button>

                {/* Sign up toggle */}
                <motion.p
                  className="mt-4 text-center text-xs text-white/60"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {authMode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                  <button type="button" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} className="group/signup relative inline-block">
                    <span className="relative z-10 font-medium text-white transition-colors duration-300 group-hover/signup:text-white/70">
                      {authMode === 'signin' ? 'Sign up' : 'Sign in'}
                    </span>
                    <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-white transition-all duration-300 group-hover/signup:w-full" />
                  </button>
                </motion.p>
              </form>
            </div>
          </div>
        </motion.div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
