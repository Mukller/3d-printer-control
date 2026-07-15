import Header from "../components/Header";
import Hero from "../components/Hero";
import Services from "../components/Services";
import Process from "../components/Process";
import Portfolio from "../components/Portfolio";
import CalculatorForm from "../components/CalculatorForm";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <Hero />
        <Services />
        <Process />
        <Portfolio />
        <CalculatorForm />
      </main>
      <Footer />
    </>
  );
}
