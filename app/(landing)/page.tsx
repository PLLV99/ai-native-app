import About from "./About"
import Features from "./Features"
import Footer from "./Footer"
import Hero from "./Hero"
import Navbar from "./Navbar"
import Team from "./Team"
import TechStack from "./TechStack"
import Testimonial from "./Testimonial"


export default function HomePage() {
    return (
        <>
            <Navbar />
            <Hero />
            <Features/>
            <About/>
            <Team/>
            <TechStack/>
            <Testimonial/>
            <Footer />
        </>
    )
}