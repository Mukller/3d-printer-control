import { useState } from "react";

const items = [
  {
    title: "Корпус для электроники",
    category: "Функциональное",
    material: "PETG",
    model: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=300&fit=crop",
    print: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=300&fit=crop",
  },
  {
    title: "Фигурка персонажа",
    category: "Декор",
    material: "PLA",
    model: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=300&fit=crop",
    print: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=300&fit=crop",
  },
  {
    title: "Крепление для камеры",
    category: "Функциональное",
    material: "PETG",
    model: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    print: "https://images.unsplash.com/photo-1592424002053-21f369ad7fdb?w=400&h=300&fit=crop",
  },
  {
    title: "Архитектурный макет",
    category: "Арт",
    material: "PLA",
    model: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&h=300&fit=crop",
    print: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=300&fit=crop",
  },
  {
    title: "Запчасть для принтера",
    category: "Функциональное",
    material: "ABS",
    model: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=300&fit=crop",
    print: "https://images.unsplash.com/photo-1563520239648-a24e51d4b570?w=400&h=300&fit=crop",
  },
  {
    title: "Органайзер на стол",
    category: "Быт",
    material: "PLA",
    model: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop",
    print: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=400&h=300&fit=crop",
  },
];

const CATEGORIES = ["Все", "Функциональное", "Декор", "Арт", "Быт"];

const MATERIAL_COLORS = {
  PLA: "bg-green-100 text-green-700",
  PETG: "bg-blue-100 text-blue-700",
  ABS: "bg-orange-100 text-orange-700",
};

export default function Portfolio() {
  const [filter, setFilter] = useState("Все");
  const [hover, setHover] = useState(null);

  const filtered = filter === "Все" ? items : items.filter((i) => i.category === filter);

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">Портфолио</h2>
        <p className="text-center text-gray-500 mb-8">
          Слева — 3D-модель, справа — готовая напечатанная деталь
        </p>

        {/* Filter */}
        <div className="flex gap-2 justify-center flex-wrap mb-10">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === c
                  ? "bg-black text-white"
                  : "bg-white border border-gray-200 hover:border-black text-gray-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, idx) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
              onMouseEnter={() => setHover(idx)}
              onMouseLeave={() => setHover(null)}
            >
              {/* Images side by side */}
              <div className="flex h-44 relative">
                <div className="w-1/2 relative overflow-hidden">
                  <img
                    src={item.model}
                    alt="3D модель"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
                    Модель
                  </span>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="w-1/2 relative overflow-hidden">
                  <img
                    src={item.print}
                    alt="Напечатанная деталь"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
                    Результат
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${MATERIAL_COLORS[item.material] || "bg-gray-100 text-gray-600"}`}>
                    {item.material}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{item.category}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-sm mt-10">
          Есть своя модель? Загрузи STL-файл ниже и сразу увидишь стоимость.
        </p>
      </div>
    </section>
  );
}
