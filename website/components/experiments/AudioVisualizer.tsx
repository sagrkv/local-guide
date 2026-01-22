"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AudioVisualizerProps {
  preview?: boolean;
}

function VisualizerBars({ barCount = 64, audioData }: { barCount?: number; audioData: number[] }) {
  const barsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!barsRef.current) return;

    const time = state.clock.elapsedTime;

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const radius = 2;

      // Get audio data or use sine wave for demo
      const audioValue = audioData[i] || Math.sin(time * 2 + i * 0.3) * 0.5 + 0.5;
      const height = 0.1 + audioValue * 2;

      // Position in circle
      dummy.position.x = Math.cos(angle) * radius;
      dummy.position.y = Math.sin(angle) * radius;
      dummy.position.z = 0;

      // Look at center and adjust rotation
      dummy.lookAt(0, 0, 0);
      dummy.rotation.x += Math.PI / 2;

      // Scale by audio
      dummy.scale.set(0.05, height, 0.05);

      dummy.updateMatrix();
      barsRef.current.setMatrixAt(i, dummy.matrix);

      // Color based on height
      const color = new THREE.Color();
      color.setHSL(0.08 + audioValue * 0.1, 1, 0.4 + audioValue * 0.3);
      barsRef.current.setColorAt(i, color);
    }

    barsRef.current.instanceMatrix.needsUpdate = true;
    if (barsRef.current.instanceColor) {
      barsRef.current.instanceColor.needsUpdate = true;
    }

    // Rotate the whole visualizer
    barsRef.current.rotation.z = time * 0.2;
  });

  return (
    <instancedMesh ref={barsRef} args={[undefined, undefined, barCount]}>
      <cylinderGeometry args={[1, 1, 1, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function CenterOrb({ audioData }: { audioData: number[] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    // Calculate average audio level
    const avgLevel = audioData.length > 0
      ? audioData.reduce((a, b) => a + b, 0) / audioData.length
      : Math.sin(time * 2) * 0.5 + 0.5;

    // Pulse based on audio
    const scale = 0.3 + avgLevel * 0.5;
    meshRef.current.scale.setScalar(scale);

    // Rotate
    meshRef.current.rotation.x = time * 0.5;
    meshRef.current.rotation.y = time * 0.3;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color="#FF9500" wireframe />
    </mesh>
  );
}

function AudioController({ onAudioData }: { onAudioData: (data: number[]) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      setHasPermission(true);
      setIsPlaying(true);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateData = () => {
        analyser.getByteFrequencyData(dataArray);
        const normalizedData = Array.from(dataArray).map((v) => v / 255);
        onAudioData(normalizedData);
        animationRef.current = requestAnimationFrame(updateData);
      };

      updateData();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!hasPermission) {
    return (
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={startAudio}
          className="px-6 py-3 bg-[var(--accent)] text-[var(--background)] rounded-full font-semibold hover:bg-[#e88800] transition-colors"
        >
          Enable Microphone
        </button>
        <p className="text-[var(--gray-500)] text-sm mt-2 text-center">
          Click to visualize your voice or music
        </p>
      </div>
    );
  }

  return null;
}

export default function AudioVisualizer({ preview = false }: AudioVisualizerProps) {
  const [audioData, setAudioData] = useState<number[]>([]);

  return (
    <div className={`relative ${preview ? "w-full h-full" : "w-full h-screen"}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={preview ? 1 : [1, 2]}
        gl={{ antialias: !preview, alpha: true }}
      >
        <color attach="background" args={["#0A0A0A"]} />
        <VisualizerBars barCount={preview ? 32 : 64} audioData={audioData} />
        <CenterOrb audioData={audioData} />
      </Canvas>
      {!preview && <AudioController onAudioData={setAudioData} />}
    </div>
  );
}
