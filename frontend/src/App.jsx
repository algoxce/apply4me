// src/App.jsx
import React from "react";
import useBackendWarmth from "./hooks/useBackendWarmth";

// ⬇️ Keep these imports pointing to your actual components
// (rename paths if your files are in different folders)
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import About from "./components/About";
import ContactForm from "./components/ContactForm";
import Footer from "./components/Footer";

export default function App() {
  // 🔥 Wake the backend once on first render (so submit feels instant)
  useBackendWarmth();

  return (
    <>
      {/* Top navigation (optional) */}
      {typeof Navbar === "function" && <Navbar />}

      {/* Hero / landing section */}
      <main>
        {typeof Hero === "function" && <Hero />}

        {/* Your services/products */}
        {typeof Services === "function" && <Services />}

        {/* About section */}
        {typeof About === "function" && <About />}

        {/* Contact / Apply form (now has robust submit & disabled states) */}
        {typeof ContactForm === "function" && <ContactForm />}
      </main>

      {/* Footer */}
      {typeof Footer === "function" && <Footer />}
    </>
  );
}
