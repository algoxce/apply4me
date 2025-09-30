export default function Navbar() {
  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="font-semibold text-lg">
          Apply4Me
        </a>
        <nav className="hidden md:flex gap-6 text-sm">
          <a href="#services" className="hover:underline">
            Services
          </a>
          <a href="#about" className="hover:underline">
            About
          </a>
          <a href="#contact" className="hover:underline">
            Contact
          </a>
          <a href="/admin" className="hover:underline">
            Admin
          </a>
        </nav>
      </div>
    </header>
  );
}
