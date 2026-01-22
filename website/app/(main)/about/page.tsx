"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  GeometricShapes,
  GlowOrb,
  CircuitPattern,
  DotGrid,
  TechLines,
  GearIcon,
  CodeIcon,
  ShieldIcon,
  LayersIcon,
} from "@/components/visuals";

const values = [
  {
    title: "Speed without sacrifice",
    description:
      "We deliver fast, but never at the cost of quality. Tight timelines force creative solutions.",
    Icon: GearIcon,
    color: "#F59E0B",
  },
  {
    title: "Honest pricing",
    description:
      "We quote what we mean. No scope creep surprises, no hidden fees.",
    Icon: ShieldIcon,
    color: "#10B981",
  },
  {
    title: "Code that lasts",
    description:
      "We write clean, documented code that your next developer will thank us for.",
    Icon: CodeIcon,
    color: "#3B82F6",
  },
  {
    title: "Design that converts",
    description: "Pretty doesn't pay bills. We design for results.",
    Icon: LayersIcon,
    color: "#8B5CF6",
  },
];

const stats = [
  { value: "30+", label: "Projects Delivered" },
  { value: "20+", label: "Happy Clients" },
  { value: "3", label: "Years in Business" },
  { value: "5", label: "Cities Served" },
];

const team = [
  {
    name: "Team Member",
    role: "Founder & Developer",
    initial: "T",
    color: "#FF9500",
  },
  {
    name: "Team Member",
    role: "Lead Designer",
    initial: "T",
    color: "#3B82F6",
  },
  {
    name: "Team Member",
    role: "Full-Stack Developer",
    initial: "T",
    color: "#10B981",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Background visuals */}
        <GeometricShapes variant="corner" className="top-20 right-0 opacity-40" />
        <GlowOrb
          className="top-0 right-1/4"
          color="var(--accent)"
          size="lg"
          intensity="low"
        />
        <DotGrid
          className="bottom-0 left-10 hidden lg:block"
          rows={6}
          cols={10}
          gap={16}
          highlightPattern
        />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              About Us
            </h1>
            <p className="text-xl text-[var(--gray-400)] max-w-2xl leading-relaxed">
              A small team that ships fast and cares about craft.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 lg:py-24 relative">
        {/* Background decorations */}
        <TechLines variant="horizontal" className="top-1/2 opacity-20" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-[var(--gray-400)] text-lg leading-relaxed">
                <p>
                  Summer Studios started with a simple frustration: too many
                  businesses were getting ripped off by agencies delivering
                  mediocre work at premium prices.
                </p>
                <p>
                  We're developers and designers who believe great websites
                  shouldn't cost a fortune or take forever. We keep our team
                  small, our processes efficient, and our prices fair.
                </p>
                <p>
                  Based in South India, we work with clients across Bangalore,
                  Hyderabad, Chennai, Mysore, and Kochi—though geography doesn't
                  limit us.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5 border border-[var(--gray-700)] flex items-center justify-center relative overflow-hidden">
                {/* Tech pattern background */}
                <div className="absolute inset-0 opacity-30">
                  <CircuitPattern animated={false} opacity={0.2} />
                </div>

                {/* Decorative dots */}
                <div className="absolute top-6 right-6">
                  <DotGrid
                    rows={5}
                    cols={5}
                    gap={12}
                    dotSize={1.5}
                    animated={false}
                    highlightPattern={false}
                  />
                </div>

                <span className="text-6xl md:text-[8rem] lg:text-[12rem] font-bold text-[var(--accent)]/20 relative z-10">
                  {`{S}`}
                </span>

                {/* Glow */}
                <GlowOrb
                  className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  color="var(--accent)"
                  size="md"
                  intensity="medium"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 lg:py-24 bg-[var(--gray-900)] relative overflow-hidden">
        {/* Background decorations */}
        <GeometricShapes variant="scattered" className="opacity-20" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="text-center"
              >
                <span className="text-4xl lg:text-5xl font-bold text-[var(--accent)]">
                  {stat.value}
                </span>
                <p className="text-[var(--gray-400)] mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-24 relative">
        {/* Background decorations */}
        <TechLines variant="vertical" className="right-0 opacity-20 hidden lg:block" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-[var(--gray-400)] text-lg max-w-xl mx-auto">
              The principles that guide how we work.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const IconComponent = value.Icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                >
                  <Card glow className="h-full text-center group">
                    <div className="mb-4 flex justify-center">
                      <IconComponent
                        size={48}
                        className="opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-[var(--gray-400)] text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 lg:py-24 bg-[var(--gray-900)]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">The Team</h2>
            <p className="text-[var(--gray-400)] text-lg max-w-xl mx-auto">
              Small team, big impact.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={member.name + index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="text-center"
              >
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `${member.color}20` }}
                >
                  <span
                    className="text-3xl font-bold"
                    style={{ color: member.color }}
                  >
                    {member.initial}
                  </span>
                </div>
                <h3 className="font-semibold text-white">{member.name}</h3>
                <p className="text-[var(--gray-500)] text-sm">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        {/* Background decorations */}
        <CircuitPattern className="opacity-15" animated />
        <GlowOrb
          className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          color="var(--accent)"
          size="xl"
          intensity="low"
        />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Want to work with us?
            </h2>
            <p className="text-[var(--gray-400)] text-lg mb-8 max-w-xl mx-auto">
              We're always looking for exciting projects. Let's build something
              great together.
            </p>
            <Button href="/contact" size="lg">
              Get in Touch
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
