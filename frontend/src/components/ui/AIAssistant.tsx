import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Globe, Sparkles } from 'lucide-react';
import { cx } from './index';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState('English');
  const [langOpen, setLangOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className="fixed bottom-20 right-4 z-50 flex h-[500px] w-[350px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl sm:right-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-brand-700 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-brand-200" />
                <h3 className="font-semibold">SchemeGuide AI</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setLangOpen(!langOpen)}
                    className="flex items-center gap-1 rounded-md bg-black/10 px-2 py-1 text-xs hover:bg-black/20"
                  >
                    <Globe size={12} /> {lang}
                  </button>
                  {langOpen && (
                    <div className="absolute right-0 top-full mt-1 w-32 rounded-lg border border-line bg-white py-1 shadow-lg">
                      {['English', 'Hindi', 'Marathi', 'Tamil'].map(l => (
                        <button 
                          key={l}
                          onClick={() => { setLang(l); setLangOpen(false); }}
                          className={cx(
                            "block w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-surface-sunken",
                            lang === l ? 'text-brand font-semibold' : 'text-ink-700'
                          )}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-white/20">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto bg-surface-sunken p-4 text-sm">
              <div className="mb-4 flex flex-col gap-1">
                <div className="w-fit max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 text-ink shadow-sm border border-line">
                  {lang === 'English' && "Hi! I'm your SchemeGuide AI assistant. How can I help you discover and apply for schemes today?"}
                  {lang === 'Hindi' && "नमस्ते! मैं आपका SchemeGuide AI सहायक हूँ। आज मैं योजनाओं को खोजने और लागू करने में आपकी कैसे मदद कर सकता हूँ?"}
                  {lang === 'Marathi' && "नमस्कार! मी तुमचा SchemeGuide AI सहाय्यक आहे. मी आज तुम्हाला योजना शोधण्यात आणि लागू करण्यात कशी मदत करू शकतो?"}
                  {lang === 'Tamil' && "வணக்கம்! நான் உங்கள் SchemeGuide AI உதவியாளர். இன்று திட்டங்களைக் கண்டறிந்து விண்ணப்பிக்க நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?"}
                </div>
                <span className="text-[10px] text-faint ml-1">Just now</span>
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-line bg-white p-3">
              <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2">
                <input 
                  type="text"
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
                />
                <button className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-600">
                  <Send size={12} className="-ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl transition-colors hover:bg-brand-700 sm:bottom-8 sm:right-8"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>
    </>
  );
}