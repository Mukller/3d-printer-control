import { useState } from "react";

const items = [
  {
    title: "Корпус для электроники",
    category: "Функциональное",
    material: "PETG",
    model: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=260&fit=crop",
    print: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=260&fit=crop",
  },
  {
    title: "Фигурка персонажа",
    category: "Декор",
    material: "PLA",
    model: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=260&fit=crop",
    print: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=260&fit=crop",
  },
  {
    title: "Крепление для камеры",
    category: "Функциональное",
    material: "PETG",
    model: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=260&fit=crop",
    print: "https://images.unsplash.com/photo-1592424002053-21f369ad7fdb?w=400&h=260&fit=crop",
  },
  {
    title: "Архитектурный макет",
    category: "Арт",
    material: "PLA",
    model: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=260&fit=crop",
    print: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=260&fit=crop",
  },
  {
    title: "Запчасть для принтера",
    category: "Функциональное",
    material: "ABS",
    model: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=260&fit=crop",
    print: "https://images.unsplash.com/photo-1563520239648-a24e51d4b570?w=400&h=260&fit=crop",
  },
  {
    title: "Органайзер на стол",
    category: "Быт",
    material: "PLA",
    model: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=260&fit=crop",
    print: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=400&h=260&fit=crop",
  },
];

const CATEGORIES = ["Все", "Функциональное", "Декор", "Арт", "Быт"];

const MATERIAL_COLORS = {
  PLA: "bg-brand-light text-brand-dark",
  PETG: "bg-blue-100 text-blue-700",
  ABS: "bg-orange-100 text-orange-700",
};

export default function Portfolio() {
  const [filter, setFilter] = useState("Все");
  const filtered = filter === "Все" ? items : items.filter((i) => i.category === filter);

  return (
    <section id="portfolio" className="py-24 bg-brand-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Наши работы</h2>
          <p className="text-brand-muted">Слева — 3D-модель, справа — готовая напечатанная деталь</p>
        </div>

        <div className="flex gap-2 justify-center flex-wrap mb-10">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === c
                  ? "bg-brand-dark text-white"
                  : "bg-white border border-gray-200 text-brand-muted hover:border-brand-dark hover:text-brand-dark"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div key={item.title} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex h-44 relative">
                <div className="w-1/2 relative overflow-hidden">
                  <img src={item.model} alt="3D модель" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-2 py-0.5 rounded font-medium">
                    Модель
                  </span>
                </div>
                <div className="w-px bg-gray-100" />
                <div className="w-1/2 relative overflow-hidden">
                  <img src={item.print} alt="Результат" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 text-xs bg-black/60 text-white px-2 py-0.5 rounded font-medium">
                    Результат
                  </span>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-brand-dark">{item.title}</h3>
                  <p className="text-xs text-brand-muted mt-0.5">{item.category}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${MATERIAL_COLORS[item.material] || "bg-gray-100 text-gray-600"}`}>
                  {item.material}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
