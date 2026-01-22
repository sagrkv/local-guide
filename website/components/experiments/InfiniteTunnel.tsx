"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface InfiniteTunnelProps {
  preview?: boolean;
}

function Tunnel({ segments = 50 }: { segments?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);

  const ringGeometry = useMemo(() => {
    return new THREE.TorusGeometry(2, 0.02, 8, 64);
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    ringsRef.current.forEach((ring, i) => {
      if (!ring) return;

      // Move rings toward camera
      ring.position.z += 0.1;

      // Reset when past camera
      if (ring.position.z > 5) {
        ring.position.z = -segments * 0.5;
      }

      // Rotation based on position
      ring.rotation.x = Math.sin(time * 0.5 + i * 0.1) * 0.2;
      ring.rotation.y = Math.cos(time * 0.3 + i * 0.1) * 0.2;

      // Scale pulsing
      const scale = 1 + Math.sin(time * 2 + i * 0.2) * 0.1;
      ring.scale.setScalar(scale);

      // Color based on z position
      const material = ring.material as THREE.MeshBasicMaterial;
      const hue = 0.08 + (ring.position.z + segments * 0.5) / segments * 0.1;
      material.color.setHSL(hue, 1, 0.5 + Math.sin(time + i) * 0.2);
    });

    if (groupRef.current) {
      groupRef.current.rotation.z = time * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: segments }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) ringsRef.current[i] = el;
          }}
          geometry={ringGeometry}
          position={[0, 0, -i * 0.5]}
        >
          <meshBasicMaterial
            color="#FF9500"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function FloatingParticles({ count = 200 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 1;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 2] += 0.05;
      if (pos[i * 3 + 2] > 15) {
        pos[i * 3 + 2] = -15;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.z = state.clock.elapsedTime * 0.05;
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
        size={0.03}
        color="#FF9500"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function InfiniteTunnel({ preview = false }: InfiniteTunnelProps) {
  return (
    <div className={preview ? "w-full h-full" : "w-full h-screen"}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 75 }}
        dpr={preview ? 1 : [1, 2]}
        gl={{ antialias: !preview, alpha: true }}
      >
        <color attach="background" args={["#0A0A0A"]} />
        <fog attach="fog" args={["#0A0A0A", 5, 25]} />
        <Tunnel segments={preview ? 30 : 50} />
        <FloatingParticles count={preview ? 100 : 200} />
      </Canvas>
    </div>
  );
}
