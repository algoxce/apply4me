export default function Services() {
  const items = [
    { title: "Profile Setup", desc: "Optimize your resume & online profiles." },
    {
      title: "Auto Applications",
      desc: "We apply to matching roles on your behalf.",
    },
    { title: "Status Tracking", desc: "See where every application stands." },
  ];
  return (
    <section id="services" className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Services</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((s) => (
            <div key={s.title} className="rounded-xl border p-5">
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
