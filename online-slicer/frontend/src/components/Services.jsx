const services = [
  {
    icon: "fas fa-bolt",
    title: "Быстрая печать",
    desc: "Слой 0.3 мм, заполнение 15%. Для прототипов, макетов и черновых деталей.",
    price: "от 3 ₽/г",
    time: "6–12 ч",
    badge: "Быстро",
    badgeClass: "bg-yellow-100 text-yellow-700",
    iconBg: "bg-yellow-50 text-yellow-600",
  },
  {
    icon: "fas fa-scale-balanced",
    title: "Стандарт",
    desc: "Слой 0.2 мм, заполнение 20%. Оптимальный баланс качества и скорости.",
    price: "от 5 ₽/г",
    time: "12–24 ч",
    badge: "Популярно",
    badgeClass: "bg-blue-100 text-blue-700",
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    icon: "fas fa-gem",
    title: "Высокое качество",
    desc: "Слой 0.1 мм, заполнение 30%. Максимальная точность и гладкость поверхности.",
    price: "от 8 ₽/г",
    time: "24–48 ч",
    badge: "Топ",
    badgeClass: "bg-purple-100 text-purple-700",
    iconBg: "bg-purple-50 text-purple-600",
  },
  {
    icon: "fas fa-droplet",
    title: "SLA/DLP Фотополимер",
    desc: "Высокоточная печать смолой. Для ювелирных изделий, миниатюр и стоматологии.",
    price: "от 12 ₽/г",
    time: "12–24 ч",
    badge: "Точно",
    badgeClass: "bg-cyan-100 text-cyan-700",
    iconBg: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: "fas fa-screwdriver-wrench",
    title: "Функциональные детали",
    desc: "PETG/ABS, заполнение 40–80%. Прочные детали для механизмов и корпусов.",
    price: "от 7 ₽/г",
    time: "от 24 ч",
    badge: "Прочно",
    badgeClass: "bg-green-100 text-green-700",
    iconBg: "bg-green-50 text-green-600",
  },
  {
    icon: "fas fa-rotate",
    title: "Серийная печать",
    desc: "Скидка от 15% при заказе от 10 единиц. Постобработка и 3D-моделирование по запросу.",
    price: "от 2.5 ₽/г",
    time: "по договору",
    badge: "Выгодно",
    badgeClass: "bg-orange-100 text-orange-700",
    iconBg: "bg-orange-50 text-orange-600",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Комплексные услуги 3D печати</h2>
          <p className="text-brand-muted">От идеи до готового изделия. Полный цикл услуг для реализации проектов любой сложности.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.title}
              className="bg-brand-bg rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${s.iconBg}`}>
                  <i className={`${s.icon} text-xl`}></i>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.badgeClass}`}>
                  {s.badge}
                </span>
              </div>

              <h3 className="text-lg font-bold text-brand-dark mb-2">{s.title}</h3>
              <p className="text-sm text-brand-muted mb-6">{s.desc}</p>

              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <div>
                  <p className="text-xl font-bold text-brand-dark">{s.price}</p>
                  <p className="text-xs text-brand-muted">грамм пластика</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-gray">{s.time}</p>
                  <p className="text-xs text-brand-muted">время печати</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 bg-brand-light rounded-2xl text-center text-sm text-brand-dark font-medium">
          Материалы: PLA, PETG, ABS, TPU. Цвет на выбор. Доставка или самовывоз.
          Для крупных заказов — индивидуальный расчёт.
        </div>
      </div>
    </section>
  );
}
