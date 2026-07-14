import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="pt-32 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold"
      >
        3D Печать нового уровня
      </motion.h1>
    </section>
  );
}