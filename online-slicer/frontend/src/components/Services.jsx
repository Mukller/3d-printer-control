const services = [
  {
    icon: "⚡",
    title: "Быстрая печать",
    desc: "Слой 0.3 мм, заполнение 15%. Для прототипов и макетов.",
    price: "от 3 ₽/г",
    time: "6–12 ч",
    badge: "Быстро",
    badgeColor: "bg-yellow-100 text-yellow-800",
  },
  {
    icon: "⚖️",
    title: "Стандарт",
    desc: "Слой 0.2 мм, заполнение 20%. Оптимальное соотношение качества и скорости.",
    price: "от 5 ₽/г",
    time: "12–24 ч",
    badge: "Популярно",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    icon: "💎",
    title: "Высокое качество",
    desc: "Слой 0.1 мм, заполнение 30%. Максимальная точность и гладкость поверхности.",
    price: "от 8 ₽/г",
    time: "24–48 ч",
    badge: "Топ",
    badgeColor: "bg-purple-100 text-purple-800",
  },
  {
    icon: "🔩",
    title: "Функциональные детали",
    desc: "PETG/ABS, заполнение 40–80%. Прочные детали для механизмов и корпусов.",
    price: "от 7 ₽/г",
    time: "от 24 ч",
    badge: "Прочно",
    badgeColor: "bg-green-100 text-green-800",
  },
  {
    icon: "🎨",
    title: "Сложные модели",
    desc: "С поддержками, несколько частей. Фигурки, архитектура, арт-объекты.",
    price: "от 10 ₽/г",
    time: "от 36 ч",
    badge: "Сложно",
    badgeColor: "bg-orange-100 text-orange-800",
  },
  {
    icon: "🔁",
    title: "Серийная печать",
    desc: "Скидка от 15% при заказе от 10 единиц одной модели.",
    price: "от 2.5 ₽/г",
    time: "по договору",
    badge: "Выгодно",
    badgeColor: "bg-red-100 text-red-800",
  },
];

export default function Services() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">Услуги и цены</h2>
        <p className="text-center text-gray-500 mb-12">
          Цена зависит от объёма модели и выбранных настроек печати
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.title}
              className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{s.icon}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.badgeColor}`}>
                  {s.badge}
                </span>
              </div>

              <h3 className="text-lg font-bold mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm mb-4 flex-1">{s.desc}</p>

              <div className="border-t pt-4 mt-auto flex justify-between items-center">
                <div>
                  <p className="text-xl font-bold text-black">{s.price}</p>
                  <p className="text-xs text-gray-400">грамм пластика</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-600">{s.time}</p>
                  <p className="text-xs text-gray-400">время печати</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 bg-gray-50 rounded-2xl text-center text-sm text-gray-500">
          💡 Материалы: PLA, PETG, ABS, TPU. Цвет на выбор. Доставка или самовывоз.
          Для крупных заказов — индивидуальный расчёт.
        </div>
      </div>
    </section>
  );
}
