"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MorphTargetsProps {
  preview?: boolean;
}

function MorphingShape() {
  const meshRef = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const targetPositions = useRef<Float32Array | null>(null);
  const currentTarget = useRef(0);

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 4), []);

  useEffect(() => {
    const positions = geometry.getAttribute("position").array as Float32Array;
    originalPositions.current = new Float32Array(positions);
    targetPositions.current = new Float32Array(positions.length);
  }, [geometry]);

  const generateTarget = (type: number, positions: Float32Array, target: Float32Array) => {
    for (let i = 0; i < positions.length; i += 3) {
      const x = originalPositions.current![i];
      const y = originalPositions.current![i + 1];
      const z = originalPositions.current![i + 2];

      if (type === 0) {
        // Sphere (inflated)
        const len = Math.sqrt(x * x + y * y + z * z);
        target[i] = (x / len) * 1.3;
        target[i + 1] = (y / len) * 1.3;
        target[i + 2] = (z / len) * 1.3;
      } else if (type === 1) {
        // Cube-like
        const max = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
        target[i] = (x / max) * 1.1;
        target[i + 1] = (y / max) * 1.1;
        target[i + 2] = (z / max) * 1.1;
      } else {
        // Spiky
        const noise = Math.sin(x * 5) * Math.cos(y * 5) * Math.sin(z * 5);
        const spike = 1 + Math.abs(noise) * 0.5;
        target[i] = x * spike;
        target[i + 1] = y * spike;
        target[i + 2] = z * spike;
      }
    }
  };

  useFrame((state) => {
    if (!meshRef.current || !originalPositions.current || !targetPositions.current) return;

    const time = state.clock.elapsedTime;
    const positions = meshRef.current.geometry.getAttribute("position").array as Float32Array;

    // Change target every 3 seconds
    const newTarget = Math.floor(time / 3) % 3;
    if (newTarget !== currentTarget.current) {
      currentTarget.current = newTarget;
      generateTarget(newTarget, positions, targetPositions.current);
    }

    // Interpolate towards target
    for (let i = 0; i < positions.length; i++) {
      positions[i] += (targetPositions.current[i] - positions[i]) * 0.03;
    }

    meshRef.current.geometry.getAttribute("position").needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();

    // Rotation
    meshRef.current.rotation.x = time * 0.3;
    meshRef.current.rotation.y = time * 0.4;

    // Update color based on target
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    const colors = [
      new THREE.Color("#FF9500"), // Orange for sphere
      new THREE.Color("#3B82F6"), // Blue for cube
      new THREE.Color("#10B981"), // Green for spiky
    ];

    const targetColor = colors[currentTarget.current];
    material.color.lerp(targetColor, 0.05);
  });

  // Initialize target on mount
  useEffect(() => {
    if (originalPositions.current && targetPositions.current) {
      generateTarget(0, originalPositions.current, targetPositions.current);
    }
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#FF9500"
        roughness={0.3}
        metalness={0.7}
        flatShading
      />
    </mesh>
  );
}

function ParticleRing() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 1000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2 + Math.random() * 0.2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#FF9500"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function MorphTargets({ preview = false }: MorphTargetsProps) {
  return (
    <div className={`relative ${preview ? "w-full h-full" : "w-full h-screen"}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        dpr={preview ? 1 : [1, 2]}
        gl={{ antialias: !preview, alpha: true }}
      >
        <color attach="background" args={["#0A0A0A"]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#FF9500" />
        <MorphingShape />
        <ParticleRing />
      </Canvas>
    </div>
  );
}
