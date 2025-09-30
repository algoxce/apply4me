export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600 flex justify-between">
        <span>© {new Date().getFullYear()} Apply4Me</span>
        <a href="#contact" className="hover:underline">
          Get in touch
        </a>
      </div>
    </footer>
  );
}
