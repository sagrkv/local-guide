import { prisma } from "../lib/prisma.js";
import { ConflictError, NotFoundError } from "../lib/errors.js";

export async function listTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export async function getTag(id: string) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new NotFoundError("Tag", id);
  return tag;
}

export async function createTag(name: string, slug: string) {
  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing) throw new ConflictError(`Tag with slug '${slug}' already exists`);
  return prisma.tag.create({ data: { name, slug } });
}

export async function updateTag(id: string, data: { name?: string; slug?: string }) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new NotFoundError("Tag", id);
  if (data.slug) {
    const existing = await prisma.tag.findUnique({ where: { slug: data.slug } });
    if (existing && existing.id !== id) {
      throw new ConflictError(`Tag with slug '${data.slug}' already exists`);
    }
  }
  return prisma.tag.update({ where: { id }, data });
}

export async function deleteTag(id: string) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new NotFoundError("Tag", id);
  return prisma.tag.delete({ where: { id } });
}
