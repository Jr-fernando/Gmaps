import prisma from '../lib/prisma.js';
import type { CompanyData } from '../types/index.js';

/**
 * Upsert companies - skip duplicates based on placeId
 * Returns count of new companies created
 */
export async function upsertCompanies(companies: CompanyData[]): Promise<{
  created: number;
  skipped: number;
}> {
  let created = 0;
  let skipped = 0;

  for (const company of companies) {
    const existing = await prisma.company.findUnique({
      where: { placeId: company.placeId },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.company.create({
      data: {
        placeId: company.placeId,
        name: company.name,
        category: company.category ?? null,
        phone: company.phone ?? null,
        whatsapp: company.whatsapp ?? null,
        website: company.website ?? null,
        instagram: company.instagram ?? null,
        address: company.address ?? null,
        city: company.city ?? null,
        state: company.state ?? null,
        lat: company.lat ?? null,
        lng: company.lng ?? null,
        rating: company.rating ?? null,
        totalReviews: company.totalReviews ?? null,
        googleMapsUrl: company.googleMapsUrl ?? null,
        searchQuery: company.searchQuery ?? null,
      },
    });
    created++;
  }

  return { created, skipped };
}

/**
 * Get all companies with optional search and pagination
 */
export async function getCompanies(params: {
  search?: string;
  city?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  const { search, city, category, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { category: { contains: search } },
      { city: { contains: search } },
    ];
  }

  if (city) {
    where.city = { contains: city };
  }

  if (category) {
    where.category = { contains: category };
  }

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        analysis: { select: { score: true, priority: true } },
        crmEntry: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.company.count({ where }),
  ]);

  return {
    companies,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get a single company by ID with all relations
 */
export async function getCompanyById(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      analysis: true,
      crmEntry: {
        include: {
          notes: { orderBy: { createdAt: 'desc' } },
        },
      },
    },
  });
}

/**
 * Delete a company by ID
 */
export async function deleteCompany(id: string) {
  return prisma.company.delete({ where: { id } });
}
