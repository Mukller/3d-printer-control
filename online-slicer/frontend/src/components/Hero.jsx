export default function Hero() {
  return (
    <section id="hero" className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-brand-dark leading-tight mb-6">
            Будущее производства с <span className="text-brand-dark">3D Технологиями</span>
          </h1>
          <p className="text-xl text-brand-muted mb-10 max-w-2xl mx-auto">
            Профессиональная 3D печать для бизнеса и личных проектов. Высокая точность, современные материалы и быстрые сроки исполнения.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <a href="#calculator">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-brand-dark text-white font-semibold text-lg hover:bg-brand-gray transition-colors shadow-lg shadow-brand-dark/20">
                Рассчитать стоимость
              </button>
            </a>
            <a href="#process">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-brand-dark font-semibold text-lg border border-gray-200 hover:border-brand-dark transition-colors flex items-center justify-center gap-2">
                <i className="fas fa-play"></i> Как мы работаем
              </button>
            </a>
          </div>

          <div className="mt-12 flex items-center justify-center gap-2 text-sm text-brand-muted font-medium">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <i key={i} className="fas fa-star"></i>
              ))}
            </div>
            <span className="text-brand-dark font-bold">5.0</span>
            <span>от 200+ клиентов</span>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-48">
            <div>
              <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-dark mb-4">
                <i className="fas fa-users"></i>
              </div>
              <h3 className="text-4xl font-bold text-brand-dark mb-1">500+</h3>
              <p className="text-sm text-brand-muted">Довольных клиентов</p>
            </div>
          </div>

          <div className="bg-brand-dark rounded-3xl p-6 shadow-sm flex flex-col justify-between h-48 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <i className="fas fa-cube text-6xl"></i>
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <i className="fas fa-layer-group"></i>
              </div>
              <h3 className="text-4xl font-bold mb-1">10k+</h3>
              <p className="text-sm text-white/70">Напечатанных деталей</p>
            </div>
          </div>

          <div className="bg-brand-light rounded-3xl p-6 shadow-sm flex flex-col justify-between h-48">
            <div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-brand-dark mb-4">
                <i className="fas fa-clock"></i>
              </div>
              <h3 className="text-4xl font-bold text-brand-dark mb-1">24ч</h3>
              <p className="text-sm text-brand-dark/70">Среднее время печати</p>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden h-48 relative">
            <img
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=300&fit=crop"
              alt="3D принтер за работой"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <p className="text-white font-medium">Высокоточное оборудование</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
