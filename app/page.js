'use client'

import { useEffect } from "react"
import { motion } from "framer-motion"

export default function MazaLabClone() {
  useEffect(() => {
    const canvas = document.getElementById("hero-particles")
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId
    let particles = []

    const speedMultiplier = 1.2
    const particleCount = 70

    function resize() {
      const hero = document.getElementById("hero")
      const width = hero ? hero.offsetWidth : window.innerWidth
      const height = hero ? hero.offsetHeight : window.innerHeight

      canvas.width = width
      canvas.height = height
    }

    function buildParticles() {
      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.48 * speedMultiplier,
        vy: (Math.random() - 0.5) * 0.48 * speedMultiplier,
        size: Math.random() * 1 + 0.5
      }))
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10
        if (p.y < -10) p.y = canvas.height + 10
        if (p.y > canvas.height + 10) p.y = -10

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = "rgb(255, 255, 255)"
        ctx.fill()
      }

      animationFrameId = window.requestAnimationFrame(draw)
    }

    function handleResize() {
      resize()
      buildParticles()
    }

    handleResize()
    draw()

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="site-shell">
      <div className="noise-overlay" />

      <nav className="topbar">
        <div className="topbar-inner">
          <a href="#hero" className="brand">
            MAZALab
          </a>

          <div className="nav-links">
            <a href="#hero">Home</a>
            <a href="#about">About</a>
            <a href="#services">Our Services</a>
            <a href="#contact">Contact</a>
          </div>

          
        </div>
      </nav>

      <section id="hero" className="hero">
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0.001, filter: "blur(10px)", y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="hero-title"
          >
            MAZALab
          </motion.h1>

          <motion.p
            initial={{ opacity: 0.001, filter: "blur(10px)", y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="hero-subtitle"
          >
            AI Strategy, Risk and Governance
          </motion.p>

          <motion.div
            initial={{ opacity: 0.001 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.28 }}
            className="hero-cta-wrap"
          >
          
          </motion.div>
        </div>

        <div className="hero-bg" aria-hidden="true">
          <div className="particles-layer">
            <canvas id="hero-particles" />
          </div>

          <motion.div
            className="hero-circle hero-circle-lg"
            animate={{ rotate: 360 }}
            transition={{ duration: 21.7, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            className="hero-circle hero-circle-sm"
            animate={{ rotate: -360 }}
            transition={{ duration: 16.7, repeat: Infinity, ease: "linear" }}
          />

          <div className="hero-void" />
        </div>
      </section>

      <section id="about" className="section-block">
        <div className="section-inner">
          <div className="section-header">
            <div className="pill">About</div>
          </div>

          <div className="content-panel">
            <h2 className="section-title">
MAZALab is an advisory initiative focused on the strategic and responsible deployment of artificial intelligence. We support organizations operating in complex regulatory environments where technology, risk and governance intersect.
            </h2>
            <p className="section-text">
              
            </p>
          </div>
        </div>
      </section>

      <section id="services" className="section-block">
        <div className="section-inner">
          <div className="section-header">
            <div className="pill">Our Services</div>
          </div>

          <div className="services-stack">
            <article className="service-row">
              <div className="service-graphic" />
              <div className="service-copy">
                <div className="pill">AI Strategy Advisory</div>
                <h3>
                  Strategic guidance for organizations adopting artificial intelligence technologies.
                </h3>
              </div>
            </article>

            <article className="service-row reverse">
              <div className="service-copy">
                <div className="pill">AI Risk and Governance</div>
                <h3>
                  Frameworks for responsible, compliant and transparent AI systems.
                </h3>
              </div>
              <div className="service-graphic" />
            </article>

            <article className="service-row">
              <div className="service-graphic" />
              <div className="service-copy">
                <div className="pill">AI Systems Oversight</div>
                <h3>
                  Independent advisory on the deployment and management of AI systems.
                </h3>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="contact" className="section-block">
        <div className="section-inner">
          <div className="section-header">
            <div className="pill">Contact</div>
          </div>

          <div className="content-panel">
            <h2 className="section-title">Start the conversation.</h2>

<form className="contact-form">
  <input
    type="text"
    name="name"
    placeholder="Your name"
    required
  />

  <input
    type="email"
    name="email"
    placeholder="Your email"
    required
  />

  <textarea
    name="message"
    placeholder="Your message"
    rows="5"
    required
  />

  <button type="submit">Send message</button>
</form>
            
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-left">
            <a href="#hero" className="footer-brand">
              MAZALab
            </a>
            <p>
              Helping organizations deploy AI systems responsibly, securely and at scale.
            </p>
          </div>

          <div className="footer-right">
            <div className="footer-col">
              <span>Pages</span>
              <a href="#hero">Home</a>
              <a href="#about">About</a>
              <a href="#services">Our Services</a>
              <a href="#contact">Contact</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span></span>
          <span></span>
          <span>© All right reserved</span>
        </div>
      </footer>
    </div>
  )
}