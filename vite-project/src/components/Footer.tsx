import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Here you would typically call an API to handle the subscription
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000);
      setEmail('');
    }
  };

  return (
    <footer className="w-full bg-gradient-to-b from-black/30 to-black/40 backdrop-filter backdrop-blur-lg border-t border-white/5">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <motion.div 
              className="group flex items-center gap-3 transition-all duration-300 hover:transform hover:translate-x-1"
              whileHover={{ x: 5 }}
            >
              <motion.span 
                className="text-3xl bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text"
                whileHover={{ 
                  y: [0, -10, 0],
                  transition: {
                    repeat: Infinity,
                    duration: 1.3,
                    ease: "easeInOut"
                  }
                }}
                whileTap={{ scale: 0.9 }}
              >
                💰
              </motion.span>
              <span className="text-2xl font-bold bg-gradient-to-r from-white via-white to-blue-400 bg-clip-text text-transparent">
                PayRoll
              </span>
            </motion.div>
            <p className="text-gray-400 text-sm leading-relaxed hover:text-gray-300 transition-colors duration-200">
              Simplifying payroll management for businesses of all sizes. Making payments easier, faster, and more secure.
            </p>
            <div className="pt-4">
              <h4 className="text-sm font-semibold text-white mb-2">Subscribe to our newsletter</h4>
              <form onSubmit={handleSubscribe} className="flex gap-2 relative">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg 
                    focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 
                    text-sm text-white placeholder-gray-500 transition-all duration-200"
                  required
                  aria-label="Email for newsletter"
                />
                <motion.button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 
                    transition-all duration-200 text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Subscribe
                </motion.button>
                {isSubscribed && (
                  <motion.div 
                    className="absolute -top-10 left-0 right-0 bg-green-500/90 text-white text-sm py-2 px-3 rounded-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    Thanks for subscribing!
                  </motion.div>
                )}
              </form>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {[
                { icon: "ℹ️", label: "About Us" },
                { icon: "⭐", label: "Features" },
                { icon: "💎", label: "Pricing" },
                { icon: "📧", label: "Contact" }
              ].map((link, index) => (
                <motion.li 
                  key={index}
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                >
                  <a 
                    href="#" 
                    className="inline-flex items-center hover:text-white transition-all duration-200 group"
                    aria-label={link.label}
                  >
                    <span className="mr-2 opacity-70 group-hover:opacity-100">{link.icon}</span>
                    <span className="transform transition-transform duration-200 group-hover:translate-x-1">
                      {link.label}
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {[
                { icon: "🔒", label: "Privacy Policy" },
                { icon: "📜", label: "Terms of Service" },
                { icon: "🍪", label: "Cookie Policy" }
              ].map((link, index) => (
                <motion.li 
                  key={index}
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                >
                  <a 
                    href="#" 
                    className="inline-flex items-center hover:text-white transition-all duration-200 group"
                    aria-label={link.label}
                  >
                    <span className="mr-2 opacity-70 group-hover:opacity-100">{link.icon}</span>
                    <span className="transform transition-transform duration-200 group-hover:translate-x-1">
                      {link.label}
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Connect</h3>
            <div className="space-y-4">
              <div className="flex space-x-4">
                {[
                  { icon: "Twitter", href: "#", path: "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" },
                  { icon: "GitHub", href: "#", path: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" },
                  { icon: "LinkedIn", href: "#", path: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" }
                ].map((social) => (
                  <motion.a 
                    key={social.icon}
                    href={social.href} 
                    className="text-gray-400 hover:text-white transition-all duration-300"
                    aria-label={`Follow us on ${social.icon}`}
                    whileHover={{ 
                      scale: 1.2, 
                      y: -5,
                      filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))" 
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={social.path} />
                    </svg>
                  </motion.a>
                ))}
              </div>
              <div className="text-sm text-gray-400">
                <motion.p 
                  className="hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
                  whileHover={{ x: 5 }}
                >
                  <span className="text-blue-400">📍</span> 123 Business Street, Suite 100
                </motion.p>
                <motion.p 
                  className="hover:text-gray-300 transition-colors duration-200 flex items-center gap-2 mt-2"
                  whileHover={{ x: 5 }}
                >
                  <span className="text-blue-400">📞</span> +1 (555) 123-4567
                </motion.p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-center text-gray-400 text-sm">
              © {currentYear} PayRoll. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              {["Support", "Status", "Security"].map((link, index) => (
                <motion.a 
                  key={index}
                  href="#" 
                  className="hover:text-white transition-colors duration-200"
                  whileHover={{ y: -2, color: "#ffffff" }}
                >
                  {link}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 