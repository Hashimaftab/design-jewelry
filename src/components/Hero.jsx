import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-background">
        <img 
          src="/hero-image.png" 
          alt="Luxury diamond jewelry collection model" 
          className="hero-image"
        />
      </div>
      
      <div className="container hero-content-wrapper">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="fade-in-up" style={{ animationDelay: '0.1s' }}>Lumière</span>
            <br />
            <span className="fade-in-up" style={{ animationDelay: '0.3s' }}>Collection</span>
          </h1>
          <p className="hero-subtitle fade-in-up" style={{ animationDelay: '0.5s' }}>
            A minimalist exploration of light, refraction, and timeless elegance.
          </p>
          
          <div className="hero-actions fade-in-up" style={{ animationDelay: '0.7s' }}>
            <button className="btn btn-primary">Shop Now</button>
            <button className="btn btn-outline">Discover More</button>
          </div>
        </div>
      </div>
    </section>
  );
}
