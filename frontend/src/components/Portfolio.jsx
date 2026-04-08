import { useState } from "react";

const images = [
  "https://via.placeholder.com/400",
  "https://via.placeholder.com/401",
];

export default function Portfolio() {
  const [i, setI] = useState(0);

  return (
    <section className="py-20 text-center">
      <img src={images[i]} className="mx-auto" />
      <button onClick={() => setI((i + 1) % images.length)}>
        Next
      </button>
    </section>
  );
}