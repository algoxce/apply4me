// frontend/src/App.jsx
import React from "react";
import useBackendWarmth from "./hooks/useBackendWarmth";

import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Services from "./components/Services.jsx";
import About from "./components/About.jsx";
import ContactForm from "./components/ContactForm.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  // Wake the backend on first render (so submit feels instant even after sleep)
  useBackendWarmth();

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <About />
        {/* Your form at the bottom (before the footer) */}
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
