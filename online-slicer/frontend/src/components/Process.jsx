export default function Process() {
  return (
    <section id="process" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-1/2">
            <div className="bg-brand-bg rounded-3xl p-8 border border-gray-100">
              <div className="mb-8">
                <h3 className="text-lg font-bold text-brand-dark mb-2">Статус заказа</h3>
                <div className="flex items-center justify-between text-sm text-brand-muted mb-2">
                  <span>Проект #4829</span>
                  <span className="text-green-500 font-medium">В процессе 65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-brand-dark h-2 rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-xs"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark">Загрузка модели</h4>
                    <p className="text-sm text-brand-muted">STL файл успешно проверен</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-xs"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark">Подготовка к печати</h4>
                    <p className="text-sm text-brand-muted">Слайсинг и генерация поддержек</p>
                  </div>
                </div>
                <div className="flex gap-4 opacity-50">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-dark text-brand-dark flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark">Процесс печати</h4>
                    <p className="text-sm text-brand-muted">Осталось примерно 2 ч. 15 мин.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-6">Простой и прозрачный процесс работы</h2>
            <p className="text-brand-muted mb-8">Мы максимально упростили процесс заказа. Вы всегда знаете, на каком этапе находится ваш проект.</p>

            <ul className="space-y-6">
              {[
                { title: "Быстрая оценка", desc: "Загрузите модель, и система автоматически рассчитает стоимость и время печати." },
                { title: "Выбор материалов", desc: "Широкий спектр пластиков и смол под любые задачи и бюджет." },
                { title: "Контроль качества", desc: "Каждая деталь проходит ручную проверку и постобработку перед отправкой." },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="fas fa-check text-brand-dark text-xs"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-dark">{item.title}</h4>
                    <p className="text-sm text-brand-muted">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
