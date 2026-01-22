"use client";

import { motion } from "framer-motion";

interface GeometricShapesProps {
  className?: string;
  variant?: "hero" | "scattered" | "corner";
}

function Hexagon({
  x,
  y,
  size,
  delay = 0,
  rotate = 0,
  opacity = 0.1
}: {
  x: number;
  y: number;
  size: number;
  delay?: number;
  rotate?: number;
  opacity?: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.polygon
        points="50,0 100,25 100,75 50,100 0,75 0,25"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1"
        transform={`translate(${x}, ${y}) scale(${size / 100}) rotate(${rotate}, 50, 50)`}
        animate={{
          rotate: [rotate, rotate + 360],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </motion.g>
  );
}

function Triangle({
  x,
  y,
  size,
  delay = 0,
  opacity = 0.08
}: {
  x: number;
  y: number;
  size: number;
  delay?: number;
  opacity?: number;
}) {
  return (
    <motion.polygon
      points="50,0 100,100 0,100"
      fill="none"
      stroke="var(--accent)"
      strokeWidth="1"
      opacity={opacity}
      transform={`translate(${x}, ${y}) scale(${size / 100})`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity, y: 0 }}
      transition={{ delay, duration: 0.6 }}
    />
  );
}

function Circle({
  x,
  y,
  size,
  delay = 0,
  filled = false,
  opacity = 0.1
}: {
  x: number;
  y: number;
  size: number;
  delay?: number;
  filled?: boolean;
  opacity?: number;
}) {
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={size}
      fill={filled ? "var(--accent)" : "none"}
      stroke={filled ? "none" : "var(--accent)"}
      strokeWidth="1"
      opacity={opacity}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
    />
  );
}

export default function GeometricShapes({
  className = "",
  variant = "hero",
}: GeometricShapesProps) {
  if (variant === "hero") {
    return (
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Large hexagons */}
        <Hexagon x={50} y={100} size={150} delay={0.2} opacity={0.06} />
        <Hexagon x={800} y={50} size={120} delay={0.4} rotate={30} opacity={0.05} />
        <Hexagon x={700} y={400} size={100} delay={0.6} rotate={15} opacity={0.04} />

        {/* Triangles */}
        <Triangle x={200} y={450} size={60} delay={0.3} opacity={0.05} />
        <Triangle x={900} y={200} size={40} delay={0.5} opacity={0.04} />

        {/* Circles */}
        <Circle x={150} y={300} size={30} delay={0.1} opacity={0.06} />
        <Circle x={850} y={350} size={20} delay={0.3} opacity={0.05} />
        <Circle x={500} y={500} size={15} delay={0.4} filled opacity={0.08} />

        {/* Small dots */}
        <Circle x={300} y={150} size={4} delay={0.2} filled opacity={0.15} />
        <Circle x={600} y={100} size={3} delay={0.3} filled opacity={0.12} />
        <Circle x={750} y={250} size={5} delay={0.4} filled opacity={0.1} />
        <Circle x={100} y={500} size={4} delay={0.5} filled opacity={0.12} />
      </svg>
    );
  }

  if (variant === "scattered") {
    return (
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <Hexagon x={20} y={50} size={80} delay={0} opacity={0.05} />
        <Hexagon x={280} y={280} size={60} delay={0.2} rotate={45} opacity={0.04} />
        <Triangle x={300} y={30} size={50} delay={0.1} opacity={0.04} />
        <Circle x={50} y={320} size={25} delay={0.3} opacity={0.05} />
        <Circle x={350} y={150} size={15} delay={0.4} filled opacity={0.08} />
      </svg>
    );
  }

  // Corner variant
  return (
    <svg
      className={`absolute w-64 h-64 pointer-events-none ${className}`}
      viewBox="0 0 200 200"
      fill="none"
    >
      <Hexagon x={20} y={20} size={100} delay={0} opacity={0.06} />
      <Circle x={150} y={150} size={20} delay={0.2} opacity={0.05} />
      <Circle x={50} y={170} size={8} delay={0.3} filled opacity={0.1} />
    </svg>
  );
}
