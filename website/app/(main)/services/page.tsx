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
  LayersIcon,
  CodeIcon,
  ServerIcon,
  ShieldIcon,
} from "@/components/visuals";

const services = [
  {
    id: 1,
    title: "Web Design",
    description:
      "Every project starts with design. We create custom interfaces that look incredible and convert visitors into customers. No templates, no shortcuts.",
    features: [
      "Brand-aligned visual design",
      "Mobile-first responsive layouts",
      "Interactive prototypes",
      "Design system documentation",
    ],
    Icon: LayersIcon,
    color: "#3B82F6",
  },
  {
    id: 2,
    title: "Web Development",
    description:
      "Clean, modern code that's fast and maintainable. We use the latest frameworks to build sites that perform.",
    features: [
      "Custom frontend development",
      "CMS integration (if needed)",
      "Performance optimization",
      "SEO fundamentals",
      "Cross-browser testing",
    ],
    Icon: CodeIcon,
    color: "#10B981",
  },
  {
    id: 3,
    title: "Web Applications",
    description:
      "Need more than a website? We build custom tools, dashboards, and platforms with proper databases, authentication, and admin panels.",
    features: [
      "Full-stack development",
      "Database design",
      "User authentication",
      "Admin dashboards",
      "API integrations",
    ],
    Icon: ServerIcon,
    color: "#F59E0B",
  },
  {
    id: 4,
    title: "Ongoing Support",
    description:
      "Websites need care. We offer maintenance packages to keep your site secure, updated, and running smoothly.",
    features: [
      "Regular updates and backups",
      "Security monitoring",
      "Performance checks",
      "Content updates",
      "Priority support",
    ],
    Icon: ShieldIcon,
    color: "#8B5CF6",
  },
];

const technologies = [
  { name: "Next.js", category: "Framework" },
  { name: "React", category: "Framework" },
  { name: "TypeScript", category: "Language" },
  { name: "Tailwind CSS", category: "Styling" },
  { name: "Framer Motion", category: "Animation" },
  { name: "GSAP", category: "Animation" },
  { name: "Three.js", category: "3D" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Prisma", category: "ORM" },
  { name: "Vercel", category: "Hosting" },
  { name: "Railway", category: "Hosting" },
  { name: "Stripe", category: "Payments" },
];

export default function ServicesPage() {
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
          cols={12}
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
              Services
            </h1>
            <p className="text-xl text-[var(--gray-400)] max-w-2xl leading-relaxed">
              We focus on what we're great at: designing and building websites
              that help businesses grow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 lg:py-24 relative">
        {/* Background lines */}
        <TechLines variant="vertical" className="left-0 opacity-20 hidden lg:block" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="space-y-16 lg:space-y-24">
            {services.map((service, index) => {
              const IconComponent = service.Icon;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    duration: 0.6,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  className={`grid lg:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  {/* Content */}
                  <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ background: `${service.color}15` }}
                      >
                        <IconComponent size={32} className="opacity-90" />
                      </div>
                      <span
                        className="text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full"
                        style={{
                          background: `${service.color}20`,
                          color: service.color,
                        }}
                      >
                        0{service.id}
                      </span>
                    </div>

                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                      {service.title}
                    </h2>

                    <p className="text-[var(--gray-400)] text-lg leading-relaxed mb-8">
                      {service.description}
                    </p>

                    <ul className="space-y-3">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: service.color }}
                          />
                          <span className="text-[var(--gray-300)]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual */}
                  <div className={index % 2 === 1 ? "lg:col-start-1" : ""}>
                    <div
                      className="aspect-square rounded-2xl relative overflow-hidden group"
                      style={{
                        background: `linear-gradient(135deg, ${service.color}10 0%, ${service.color}03 100%)`,
                      }}
                    >
                      {/* Tech visual background */}
                      <div className="absolute inset-0 opacity-30">
                        <CircuitPattern animated={false} opacity={0.15} />
                      </div>

                      {/* Central icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                          {/* Glow behind icon */}
                          <div
                            className="absolute inset-0 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
                            style={{ background: service.color }}
                          />
                          <IconComponent
                            size={160}
                            className="relative z-10 opacity-20 group-hover:opacity-30 transition-opacity"
                          />
                        </div>
                      </div>

                      {/* Decorative dots */}
                      <div className="absolute top-6 right-6">
                        <DotGrid
                          rows={4}
                          cols={4}
                          gap={12}
                          dotSize={1.5}
                          animated={false}
                          highlightPattern={false}
                        />
                      </div>

                      <div
                        className="absolute inset-0 border border-opacity-20 rounded-2xl group-hover:border-opacity-40 transition-all"
                        style={{ borderColor: service.color }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-16 lg:py-24 bg-[var(--gray-900)] relative overflow-hidden">
        {/* Background decorations */}
        <GeometricShapes variant="scattered" className="opacity-20" />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Technologies we use
            </h2>
            <p className="text-[var(--gray-400)] text-lg max-w-xl mx-auto">
              We work with modern tools and frameworks to deliver fast,
              scalable, and maintainable solutions.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                <Card hover className="text-center py-6">
                  <p className="font-semibold text-white">{tech.name}</p>
                  <p className="text-xs text-[var(--gray-500)] mt-1">
                    {tech.category}
                  </p>
                </Card>
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
              Ready to get started?
            </h2>
            <p className="text-[var(--gray-400)] text-lg mb-8 max-w-xl mx-auto">
              Check out our pricing or get in touch to discuss your project.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button href="/pricing" size="lg">
                View Pricing
              </Button>
              <Button href="/contact" variant="secondary" size="lg">
                Contact Us
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
