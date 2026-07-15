export default function Header() {
  return (
    <header id="header" className="fixed top-0 w-full z-50 bg-brand-bg/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <i className="fas fa-cube text-2xl text-brand-dark"></i>
            <span className="font-bold text-xl text-brand-dark tracking-tight">Print3D</span>
          </div>

          <nav className="hidden md:flex space-x-8">
            <a href="#services" className="text-brand-muted hover:text-brand-dark transition-colors">Услуги</a>
            <a href="#process" className="text-brand-muted hover:text-brand-dark transition-colors">Процесс</a>
            <a href="#portfolio" className="text-brand-muted hover:text-brand-dark transition-colors">Портфолио</a>
            <a href="#calculator" className="text-brand-muted hover:text-brand-dark transition-colors">Калькулятор</a>
          </nav>

          <div className="hidden md:flex items-center">
            <a href="#calculator">
              <button className="px-6 py-2.5 rounded-full bg-brand-dark text-white font-medium hover:bg-brand-gray transition-colors">
                Заказать печать
              </button>
            </a>
          </div>

          <div className="md:hidden flex items-center">
            <button className="text-brand-gray hover:text-brand-dark focus:outline-none">
              <i className="fas fa-bars text-2xl"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
