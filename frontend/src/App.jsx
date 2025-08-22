import { useState } from "react";
import { Typewriter } from "react-simple-typewriter";

export default function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("mobile", mobile);
    formData.append("message", message);
    if (resumeFile) {
      formData.append("resume", resumeFile);
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/submit`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        setSuccess("✅ Submitted successfully!");
        setName("");
        setEmail("");
        setMobile("");
        setMessage("");
        setResumeFile(null);
      } else {
        setSuccess("❌ Submission failed. Try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSuccess("❌ Error submitting form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-black via-[#1f1b2e] to-[#5b21b6] min-h-screen text-white font-sans">
      {/* Navbar */}
      <header className="w-full px-6 py-4 flex justify-between items-center bg-white/5 backdrop-blur-md border-b border-white/10 fixed top-0 z-50">
        <h1 className="text-xl font-bold text-purple-400">Apply4Me</h1>
        <nav className="space-x-6 hidden sm:block">
          {["about", "services", "contact"].map((link) => (
            <a
              key={link}
              href={`#${link}`}
              className="text-white hover:text-purple-400 transition duration-300"
            >
              {link.charAt(0).toUpperCase() + link.slice(1)}
            </a>
          ))}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
          Career Boost With{" "}
          <span className="text-purple-400 slow-blink ml-1">
            <Typewriter
              words={[
                "Career-Defining Resumes",
                "Strategic Job Applications",
                "Elegant CVs That Win Interviews",
                "Professional Portfolios That Impress",
                "Tailored Career Branding",
              ]}
              loop={Infinity}
              cursor
              cursorStyle="|"
              typeSpeed={40}
              deleteSpeed={30}
              delaySpeed={1500}
            />
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 max-w-xl mb-8">
          And apply for you — professionally, smartly, and effectively. Let us
          save your time.
        </p>
        <a href="#contact">
          <button className="bg-purple-600 text-white font-semibold px-8 py-3 rounded-full shadow-md transition-all duration-500 ease-in-out transform hover:scale-105 hover:shadow-purple-500/50 hover:bg-purple-500">
            Get Started
          </button>
        </a>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-[#0d0b16] px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12 text-purple-400">
            Our Services
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "📝",
                title: "Resume Writing",
                text: "We craft ATS-optimized resumes tailored for your industry.",
              },
              {
                icon: "👔",
                title: "Job Applications",
                text: "We apply to jobs for you smartly using top job platforms.",
              },
              {
                icon: "📩",
                title: "Instant Delivery",
                text: "Receive your resume within hours — ready to apply.",
              },
            ].map((service, i) => (
              <div
                key={i}
                className="bg-[#1f1b2e] p-8 rounded-xl shadow-md transition-all duration-500 ease-in-out transform hover:scale-105 hover:bg-purple-700/20 hover:shadow-purple-500/30"
              >
                <span className="text-4xl">{service.icon}</span>
                <h3 className="text-xl font-semibold mt-4 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-300">{service.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="py-20 bg-[#15121e] px-6 flex justify-center"
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl max-w-3xl p-10 text-center transition duration-500 hover:shadow-purple-500/30 hover:scale-[1.02]">
          <h2 className="text-4xl font-bold mb-6 text-purple-400">
            Why Choose Us?
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            At <span className="text-purple-400 font-semibold">Apply4Me</span>,
            we don't just build resumes — we help shape careers. Our team blends
            professional writing expertise with market insights to craft modern,
            effective CVs. We also apply for jobs on your behalf to save your
            time and deliver results.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[#1f1b2e] via-[#2a223d] to-[#3e2c5a] text-white px-6 flex justify-center">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 shadow-xl rounded-2xl max-w-3xl p-10 text-center transition-all duration-500 hover:shadow-purple-500/30 hover:scale-[1.02]">
          <h2 className="text-4xl font-bold mb-6">
            Ready to <span className="text-purple-400">Get Hired</span>?
          </h2>
          <p className="text-gray-300 mb-8 text-lg">
            Let’s build your professional brand, craft a powerful resume, and
            apply for jobs that match your goals.
          </p>
          <a href="#contact">
            <button className="bg-purple-600 px-8 py-3 rounded-full font-semibold text-white hover:bg-purple-500 transition duration-300">
              Let's Get Started
            </button>
          </a>
        </div>
      </section>

      {/* Contact Form */}
      <section
        id="contact"
        className="py-20 bg-[#15121e] px-6 text-white flex justify-center"
      >
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-10 w-full max-w-2xl shadow-xl transition duration-500 hover:shadow-purple-500/30 hover:scale-[1.02]">
          <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">
            Send Us Your Resume
          </h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-[#1f1b2e] border border-white/10 rounded-md focus:ring-2 focus:ring-purple-500 transition"
            />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[#1f1b2e] border border-white/10 rounded-md focus:ring-2 focus:ring-purple-500 transition"
            />
            <input
              type="tel"
              placeholder="+974 66XXXXXX"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-4 py-2 bg-[#1f1b2e] border border-white/10 rounded-md focus:ring-2 focus:ring-purple-500 transition"
            />
            <textarea
              rows="4"
              placeholder="Message (Optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 bg-[#1f1b2e] border border-white/10 rounded-md focus:ring-2 focus:ring-purple-500 transition"
            />
            <input
              type="file"
              onChange={(e) => setResumeFile(e.target.files[0])}
              className="w-full bg-[#1f1b2e] text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 transition"
            />
            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-3 rounded-full font-semibold text-white transition-all duration-300 ${
                  loading
                    ? "bg-purple-300 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-500"
                }`}
              >
                {loading ? "Submitting..." : "Submit & Apply"}
              </button>
              {success && (
                <p className="mt-3 text-sm text-purple-300">{success}</p>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0b16] border-white/10 py-6 text-center text-gray-400 text-sm">
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="text-purple-400 font-semibold">Apply4Me</span>
        </p>
        <p className="mt-1">
          Crafted With 💜 by{" "}
          <span className="text-white font-semibold">Mr. ADAM</span>
        </p>
      </footer>
    </div>
  );
}
