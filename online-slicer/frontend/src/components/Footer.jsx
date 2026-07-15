export default function Footer() {
  return (
    <footer id="footer" className="bg-brand-gray pt-20 pb-10 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <i className="fas fa-cube text-2xl text-brand-light"></i>
              <span className="font-bold text-xl text-white tracking-tight">Print3D</span>
            </div>
            <p className="text-brand-muted text-sm mb-6">
              Профессиональные услуги 3D печати и моделирования. Быстро, качественно, надежно.
            </p>
            <div className="flex space-x-4">
              {["fab fa-telegram", "fab fa-vk", "fab fa-youtube"].map((icon) => (
                <a key={icon} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-brand-light hover:text-brand-dark transition-colors">
                  <i className={icon}></i>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Услуги</h4>
            <ul className="space-y-3 text-sm text-brand-muted">
              {["FDM Печать", "SLA Печать", "3D Моделирование", "Постобработка", "Серийное производство"].map((s) => (
                <li key={s}><a href="#services" className="hover:text-white transition-colors">{s}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Информация</h4>
            <ul className="space-y-3 text-sm text-brand-muted">
              {["О компании", "Материалы", "Требования к моделям", "Доставка и оплата", "FAQ"].map((s) => (
                <li key={s}><a href="#" className="hover:text-white transition-colors">{s}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Контакты</h4>
            <ul className="space-y-4 text-sm text-brand-muted">
              <li className="flex items-start gap-3">
                <i className="fas fa-envelope mt-1 text-brand-light"></i>
                <a href="mailto:hello@print3d.com" className="hover:text-white transition-colors">hello@print3d.com</a>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-phone mt-1 text-brand-light"></i>
                <a href="tel:+375293079478" className="hover:text-white transition-colors">+375 (29) 307-94-78</a>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-location-dot mt-1 text-brand-light"></i>
                <span>г. Минск, ул. Примерная, д. 1</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-brand-muted">
          <p>© 2026 Print3D. Все права защищены.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-white transition-colors">Пользовательское соглашение</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
