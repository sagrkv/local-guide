"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface DeviceMockupProps {
  type: "laptop" | "phone" | "tablet";
  src?: string;
  alt?: string;
  className?: string;
  animated?: boolean;
}

export default function DeviceMockup({
  type,
  src,
  alt = "Project screenshot",
  className = "",
  animated = true,
}: DeviceMockupProps) {
  if (type === "laptop") {
    return (
      <motion.div
        className={`relative ${className}`}
        initial={animated ? { opacity: 0, y: 20 } : undefined}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      >
        {/* Laptop frame */}
        <div className="relative">
          {/* Screen bezel */}
          <div className="relative bg-[#1a1a1a] rounded-t-xl p-2 border border-[#333]">
            {/* Camera notch */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#222] border border-[#333]" />

            {/* Screen */}
            <div className="relative aspect-[16/10] bg-[#0a0a0a] rounded-lg overflow-hidden">
              {src ? (
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 border-2 border-dashed border-[#333] rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Screen reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Keyboard base */}
          <div className="relative h-3 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-b-lg">
            {/* Hinge */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-[#333]" />
            {/* Notch for opening */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#222] rounded-t-sm" />
          </div>

          {/* Shadow */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/30 blur-xl rounded-full" />
        </div>
      </motion.div>
    );
  }

  if (type === "phone") {
    return (
      <motion.div
        className={`relative ${className}`}
        initial={animated ? { opacity: 0, y: 20 } : undefined}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      >
        {/* Phone frame */}
        <div className="relative bg-[#1a1a1a] rounded-[2rem] p-2 border border-[#333]">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />

          {/* Screen */}
          <div className="relative aspect-[9/19.5] bg-[#0a0a0a] rounded-[1.5rem] overflow-hidden">
            {src ? (
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-dashed border-[#333] rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Screen reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          </div>

          {/* Side buttons */}
          <div className="absolute -left-[2px] top-24 w-[2px] h-8 bg-[#333] rounded-l" />
          <div className="absolute -left-[2px] top-36 w-[2px] h-12 bg-[#333] rounded-l" />
          <div className="absolute -right-[2px] top-28 w-[2px] h-16 bg-[#333] rounded-r" />
        </div>

        {/* Shadow */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[60%] h-4 bg-black/30 blur-xl rounded-full" />
      </motion.div>
    );
  }

  // Tablet
  return (
    <motion.div
      className={`relative ${className}`}
      initial={animated ? { opacity: 0, y: 20 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
    >
      {/* Tablet frame */}
      <div className="relative bg-[#1a1a1a] rounded-2xl p-3 border border-[#333]">
        {/* Camera */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#222] border border-[#333]" />

        {/* Screen */}
        <div className="relative aspect-[4/3] bg-[#0a0a0a] rounded-xl overflow-hidden">
          {src ? (
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-2 border-dashed border-[#333] rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-[#444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}

          {/* Screen reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Shadow */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-4 bg-black/30 blur-xl rounded-full" />
    </motion.div>
  );
}

// Grouped device mockups for project showcase
export function DeviceShowcase({
  laptopSrc,
  phoneSrc,
  className = "",
}: {
  laptopSrc?: string;
  phoneSrc?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <DeviceMockup
        type="laptop"
        src={laptopSrc}
        className="w-full max-w-2xl mx-auto"
      />
      <DeviceMockup
        type="phone"
        src={phoneSrc}
        className="absolute -right-4 -bottom-8 w-24 md:w-32"
      />
    </div>
  );
}
