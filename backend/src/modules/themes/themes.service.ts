import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

const THEME_DEFAULTS = {
  colorPrimary: '#1E3A5F',
  colorSecondary: '#F5E6D3',
  colorAccent: '#D4A574',
  colorBackground: '#FAFAF8',
  colorText: '#1A1A1A',
  displayFontFamily: "'Playfair Display', serif",
  bodyFontFamily: "'Inter', sans-serif",
  iconPack: 'default',
};

export interface UpsertThemeData {
  themePresetId?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  colorAccent?: string;
  colorBackground?: string;
  colorText?: string;
  displayFontUrl?: string;
  displayFontFamily?: string;
  bodyFontUrl?: string;
  bodyFontFamily?: string;
  logoUrl?: string;
  emblemUrl?: string;
  backgroundPatternUrl?: string;
  mapStyleJson?: Prisma.InputJsonValue;
  mapTileUrl?: string;
  iconPack?: string;
}

export const themesService = {
  async getThemeByCityId(cityId: string) {
    const theme = await prisma.cityTheme.findUnique({
      where: { cityId },
    });

    if (!theme) {
      return { ...THEME_DEFAULTS, cityId, isDefault: true };
    }

    return { ...theme, isDefault: false };
  },

  async upsertTheme(cityId: string, data: UpsertThemeData) {
    return prisma.cityTheme.upsert({
      where: { cityId },
      create: {
        city: { connect: { id: cityId } },
        ...data,
      },
      update: data,
    });
  },
};
