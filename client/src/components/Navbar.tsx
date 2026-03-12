import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="container flex items-center justify-between h-16 lg:h-18">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-lg bg-[#1a365d] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-['DM_Sans'] font-bold text-[#1a365d] text-lg tracking-tight">
              Renta Fácil
            </span>
            <span className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">
              by TPymes
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors no-underline ${
              location === "/" ? "text-[#1a365d]" : "text-gray-500 hover:text-[#1a365d]"
            }`}
          >
            Inicio
          </Link>
          <Link
            href="/simulador"
            className={`text-sm font-medium transition-colors no-underline ${
              location === "/simulador" ? "text-[#1a365d]" : "text-gray-500 hover:text-[#1a365d]"
            }`}
          >
            Simulador
          </Link>
          <a
            href="#como-funciona"
            className="text-sm font-medium text-gray-500 hover:text-[#1a365d] transition-colors no-underline"
          >
            Cómo funciona
          </a>
          <a
            href="#precios"
            className="text-sm font-medium text-gray-500 hover:text-[#1a365d] transition-colors no-underline"
          >
            Precios
          </a>
          <Link
            href="/blog"
            className={`text-sm font-medium transition-colors no-underline ${
              location.startsWith("/blog") ? "text-[#1a365d]" : "text-gray-500 hover:text-[#1a365d]"
            }`}
          >
            Blog
          </Link>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/empezar">
            <Button className="bg-[#059669] hover:bg-[#047857] text-white font-semibold px-6 shadow-lg shadow-emerald-200/50 transition-all hover:shadow-emerald-300/50 hover:-translate-y-0.5">
              Hacer mi renta
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5 text-[#1a365d]" /> : <Menu className="w-5 h-5 text-[#1a365d]" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="container py-4 flex flex-col gap-3">
              <Link
                href="/"
                className="text-sm font-medium text-gray-700 py-2 no-underline"
                onClick={() => setIsOpen(false)}
              >
                Inicio
              </Link>
              <Link
                href="/simulador"
                className="text-sm font-medium text-gray-700 py-2 no-underline"
                onClick={() => setIsOpen(false)}
              >
                Simulador
              </Link>
              <a href="#como-funciona" className="text-sm font-medium text-gray-700 py-2 no-underline" onClick={() => setIsOpen(false)}>
                Cómo funciona
              </a>
              <a href="#precios" className="text-sm font-medium text-gray-700 py-2 no-underline" onClick={() => setIsOpen(false)}>
                Precios
              </a>
              <Link
                href="/blog"
                className="text-sm font-medium text-gray-700 py-2 no-underline"
                onClick={() => setIsOpen(false)}
              >
                Blog
              </Link>
              <Link href="/empezar" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold">
                  Hacer mi renta
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
