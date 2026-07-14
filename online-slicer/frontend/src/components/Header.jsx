export default function Header() {
  return (
    <header className="fixed top-0 w-full bg-white shadow z-50">
      <div className="max-w-7xl mx-auto flex justify-between p-4">
        <h1 className="font-bold">Print3D</h1>
        <button className="bg-black text-white px-4 py-2 rounded">
          Заказать
        </button>
      </div>
    </header>
  );
}