import { useEffect, useRef } from "react";

export default function BraceParticles({
    children,
    braceAnchorSelector = null,
    braceAnchorOffsetY = 0,
    height = "clamp(220px, 34vh, 600px)"
}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
        const isMobileViewport = () => window.innerWidth < 768;
        let particles = [];
        let animationFrameId;
        let resizeObserver;
        let width = container.clientWidth || window.innerWidth;
        let height = isMobileViewport()
            ? Math.min(340, window.innerHeight * 0.34)
            : Math.min(600, window.innerHeight * 0.50);

        const getAnchorMetrics = () => {
            if (!braceAnchorSelector || !contentRef.current) return null;

            const anchor = contentRef.current.querySelector(braceAnchorSelector);
            if (!anchor) return null;

            const containerRect = container.getBoundingClientRect();
            const anchorRect = anchor.getBoundingClientRect();
            const centerX = anchorRect.left - containerRect.left + anchorRect.width / 2;
            const centerY = anchorRect.top - containerRect.top + anchorRect.height / 2 + braceAnchorOffsetY;

            return {
                centerX: clamp(centerX, 0, width),
                centerY: clamp(centerY, 0, height),
                width: anchorRect.width
            };
        };

        const resize = () => {
            width = container.clientWidth || window.innerWidth;
            const measuredHeight = container.clientHeight;
            const isMobile = isMobileViewport();
            height = measuredHeight > 0
                ? measuredHeight
                : (isMobile
                    ? Math.min(340, window.innerHeight * 0.34)
                    : Math.min(600, window.innerHeight * 0.50));
            // Adjust canvas resolution dynamically
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            initParticles();
        };

        const initParticles = () => {
            particles = [];
            const isMobile = isMobileViewport();
            const density = 4;

            // Create an offscreen canvas to render text for sampling
            const offCanvas = document.createElement("canvas");
            offCanvas.width = width;
            offCanvas.height = height;
            const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
            if (!offCtx) return;

            // Ensure crisp text rendering for sampling
            offCtx.textBaseline = "middle";
            offCtx.textAlign = "center";

            // Use fallback sequence leaning heavily on system-ui or a reliable font
            // Mobile uses a smaller brace size/offset so content remains readable.
            const fontSize = isMobile
                ? clamp(width * 0.24, 78, 120)
                : clamp(width * 0.45, 160, 260);
            offCtx.font = `300 ${fontSize}px "Outfit", "Segoe UI", sans-serif`;

            const anchorMetrics = getAnchorMetrics();

            // Calculate positions dynamically around center (or anchored element when provided)
            const centerX = anchorMetrics?.centerX ?? (width / 2);
            const centerY = anchorMetrics?.centerY ?? (height / 2);

            // Offset to flank the text. Keep it responsive but bounded.
            const braceOffset = anchorMetrics?.width
                ? (isMobile
                    ? clamp(anchorMetrics.width * 0.62, 110, 190)
                    : clamp(anchorMetrics.width * 0.64, 170, 430))
                : (isMobile
                    ? clamp(width * 0.40, 115, 190)
                    : clamp(width * 0.42, 140, 430));

            // Draw left brace
            offCtx.fillText("{", centerX - braceOffset, centerY);

            // Draw right brace
            offCtx.fillText("}", centerX + braceOffset, centerY);

            // Extract pixel data from the offscreen canvas
            const imageData = offCtx.getImageData(0, 0, width, height).data;

            // Scan rows and columns based on density
            for (let y = 0; y < height; y += density) {
                for (let x = 0; x < width; x += density) {
                    const index = (y * width + x) * 4;
                    const alpha = imageData[index + 3];

                    if (alpha > 128) {
                        // Target coordinate found!
                        particles.push({
                            x: Math.random() * width, // Start randomly across the screen
                            y: Math.random() * height,
                            baseX: x,                 // The target X coordinate perfectly forming the '{' or '}'
                            baseY: y,                 // The target Y coordinate
                            size: Math.random() * 1.5 + 0.5,
                            vx: 0,
                            vy: 0,
                            color: isMobile ? "rgba(66,133,244,0.88)" : "#4285F4" // Google Blue
                        });
                    }
                }
            }

            // Add some random "ambient" particles that aren't part of the text
            const ambientCount = isMobile ? 30 : 100;
            for (let i = 0; i < ambientCount; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    baseX: Math.random() * width,  // Random target
                    baseY: Math.random() * height,
                    size: isMobile ? (Math.random() * 0.8 + 0.3) : (Math.random() * 1.5 + 0.5),
                    vx: 0,
                    vy: 0,
                    color: isMobile ? "rgba(154,160,166,0.6)" : "#9aa0a6", // Grey
                    isAmbient: true
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            const time = Date.now() * 0.001;

            // Mouse interaction config
            // Note: We'd need to track mouse state in production, but for now we'll just let them form.
            const mouseActive = false;
            const mouseX = 0;
            const mouseY = 0;
            const mouseRadius = 100;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // 1. Spring force to target coordinate
                const dx = p.baseX - p.x;
                const dy = p.baseY - p.y;

                // Ambient particles wander loosely, text particles snap tightly
                const stiffness = p.isAmbient ? 0.01 : 0.08;
                const dampen = 0.75;

                p.vx += dx * stiffness;
                p.vy += dy * stiffness;

                // 2. Continuous slight wandering / Perlin noise effect
                // Smoother, lower amplitude noise so they don't look "weird" or jittery
                const noiseX = Math.sin(time + p.baseY * 0.05) * 0.25;
                const noiseY = Math.cos(time + p.baseX * 0.05) * 0.25;

                p.vx += noiseX;
                p.vy += noiseY;

                // 3. Optional: Mouse repulsion (disabled by default here for pure formation)
                if (mouseActive) {
                    const distToMouse = Math.hypot(p.x - mouseX, p.y - mouseY);
                    if (distToMouse < mouseRadius) {
                        const force = (mouseRadius - distToMouse) / mouseRadius;
                        p.vx -= ((mouseX - p.x) / distToMouse) * force * 5;
                        p.vy -= ((mouseY - p.y) / distToMouse) * force * 5;
                    }
                }

                // Apply dampen and velocity
                p.vx *= dampen;
                p.vy *= dampen;
                p.x += p.vx;
                p.y += p.vy;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();

                // Optional: draw faint connection lines if very close to target (adds technical feel)
                if (!p.isAmbient && Math.hypot(dx, dy) < 5) {
                    // Look at next particle
                    if (i < particles.length - 1 && !particles[i + 1].isAmbient) {
                        const np = particles[i + 1];
                        const distToNext = Math.hypot(p.x - np.x, p.y - np.y);
                        if (distToNext < 15) {
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(np.x, np.y);
                            ctx.strokeStyle = `rgba(66, 133, 244, ${0.2 - (distToNext / 15) * 0.2})`;
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                        }
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        const fontsReady = document.fonts?.ready ?? Promise.resolve();
        fontsReady.then(() => {
            resize();
            animate();

            if (typeof ResizeObserver !== "undefined") {
                resizeObserver = new ResizeObserver(resize);
                resizeObserver.observe(container);
                if (contentRef.current) {
                    resizeObserver.observe(contentRef.current);
                    const anchor = braceAnchorSelector
                        ? contentRef.current.querySelector(braceAnchorSelector)
                        : null;
                    if (anchor) resizeObserver.observe(anchor);
                }
            }
        });

        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [braceAnchorOffsetY, braceAnchorSelector]);

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", height, overflow: "hidden" }}>
            {/* Background Canvas Layer */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 0,
                    pointerEvents: "none" // Let clicks pass through to text/buttons
                }}
            />

            {/* Overlayed HTML content (Achieve new heights) */}
            <div ref={contentRef} style={{ position: "relative", zIndex: 1, textAlign: "center", width: "100%", maxWidth: "800px" }}>
                {children}
            </div>
        </div>
    );
}
