import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Particles } from "@tsparticles/react";

export default function ParticleHoverCard({ title, description, icon, to, isComingSoon }) {
    const [isHovered, setIsHovered] = useState(false);

    // When hovered, particles attract to a center mask or change behavior.
    // To simulate antigravity morphing to a neural brain shape:
    // We'll switch the particle configuration smoothly based on isHovered state.

    const particlesOptions = useMemo(() => {
        return {
            fullScreen: { enable: false },
            background: { color: { value: "transparent" } },
            fpsLimit: 60,
            particles: {
                color: { value: isHovered ? ["#4285F4", "#EA4335", "#FBBC05", "#34A853"] : "#d1d5db" },
                links: {
                    enable: isHovered,
                    color: "#4285F4",
                    distance: 100,
                    opacity: 0.3,
                    width: 1,
                },
                move: {
                    enable: true,
                    speed: isHovered ? 2 : 0.5,
                    direction: isHovered ? "none" : "top",
                    random: false,
                    straight: false,
                    outModes: { default: "bounce" },
                },
                number: { density: { enable: true, area: 400 }, value: isHovered ? 80 : 40 },
                opacity: { value: isHovered ? { min: 0.4, max: 0.8 } : 0.2 },
                shape: { type: "circle" },
                size: { value: isHovered ? { min: 1, max: 4 } : { min: 1, max: 2 } },
            },
            interactivity: {
                events: {
                    onHover: { enable: true, mode: "attract" }
                },
                modes: {
                    attract: { distance: 200, duration: 0.4, factor: 3 }
                }
            },
            detectRetina: true,
        };
    }, [isHovered]);

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.05)",
                borderRadius: "16px",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                minHeight: "300px"
            }}
        >
            {/* Background Particles layer */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none" }}>
                <Particles
                    id={`card-particles-${title.replace(/\\s+/g, '')}`}
                    options={particlesOptions}
                    style={{ width: "100%", height: "100%" }}
                />
                {/* Glow overlay when hovered */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "radial-gradient(circle at center, rgba(66, 133, 244, 0.05) 0%, transparent 70%)"
                    }}
                />
            </div>

            {/* Content layer */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ background: isComingSoon ? "#fce8e6" : "#e8f0fe", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", color: isComingSoon ? "#ea4335" : "#1a73e8" }}>
                    {icon}
                </div>

                <h3 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.5rem 0", color: "#1a1a1a" }}>{title}</h3>
                <p style={{ color: "#5f6368", lineHeight: 1.5, flex: 1, margin: "0 0 2rem 0" }}>
                    {description}
                </p>

                <Link
                    to={to}
                    style={{
                        display: "inline-block",
                        padding: "0.6rem 1.4rem",
                        background: isHovered ? "#1a73e8" : "#f8f9fa",
                        color: isHovered ? "#ffffff" : "#1a1a1a",
                        fontWeight: 500,
                        borderRadius: "50px",
                        textDecoration: "none",
                        alignSelf: "flex-start",
                        transition: "all 0.3s ease",
                        border: isHovered ? "1px solid transparent" : "1px solid rgba(0,0,0,0.1)",
                        marginTop: "auto",
                        pointerEvents: isComingSoon ? "none" : "auto",
                        opacity: isComingSoon ? 0.6 : 1
                    }}
                >
                    {isComingSoon ? "Coming soon" : "Go to course"}
                </Link>
            </div>
        </div>
    );
}
