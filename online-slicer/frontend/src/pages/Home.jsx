import Header from "../components/Header";
import Hero from "../components/Hero";
import Services from "../components/Services";
import Portfolio from "../components/Portfolio";
import CalculatorForm from "../components/CalculatorForm";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <Services />
      <Portfolio />
      <CalculatorForm />
    </>
  );
}