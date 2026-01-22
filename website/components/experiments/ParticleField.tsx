"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

interface ParticleFieldProps {
  preview?: boolean;
}

function Particles({ count = 50000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { mouse, viewport } = useThree();

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  const colors = useMemo(() => {
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Gradient from orange to white
      const t = Math.random();
      color.setHSL(0.08, 1, 0.5 + t * 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return colors;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;

    const time = state.clock.elapsedTime;
    const positions = ref.current.geometry.attributes.position.array as Float32Array;

    // Mouse influence
    const mouseX = (mouse.x * viewport.width) / 2;
    const mouseY = (mouse.y * viewport.height) / 2;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];

      // Distance to mouse
      const dx = x - mouseX;
      const dy = y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Repel from mouse
      if (dist < 2) {
        const force = (2 - dist) * 0.02;
        positions[i3] += dx * force;
        positions[i3 + 1] += dy * force;
      }

      // Oscillation
      positions[i3 + 1] += Math.sin(time + x * 0.5) * 0.002;
      positions[i3] += Math.cos(time + y * 0.5) * 0.002;

      // Contain particles
      if (Math.abs(positions[i3]) > 5) positions[i3] *= 0.99;
      if (Math.abs(positions[i3 + 1]) > 5) positions[i3 + 1] *= 0.99;
      if (Math.abs(positions[i3 + 2]) > 5) positions[i3 + 2] *= 0.99;
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y = time * 0.05;
  });

  return (
    <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export default function ParticleField({ preview = false }: ParticleFieldProps) {
  return (
    <div className={preview ? "w-full h-full" : "w-full h-screen"}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={preview ? 1 : [1, 2]}
        gl={{ antialias: !preview, alpha: true }}
      >
        <color attach="background" args={["#0A0A0A"]} />
        <ambientLight intensity={0.5} />
        <Particles count={preview ? 10000 : 50000} />
      </Canvas>
    </div>
  );
}
