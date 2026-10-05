import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { LostItem, FoundItem } from '../../database/entities/all-entities';

export interface SearchParams {
  query?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  color?: string;
  brand?: string;
  status?: string;
  type?: 'lost' | 'found' | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(LostItem)
    private readonly lostItemRepo: Repository<LostItem>,
    @InjectRepository(FoundItem)
    private readonly foundItemRepo: Repository<FoundItem>,
  ) {}

  async search(params: SearchParams) {
    const {
      query,
      category,
      dateFrom,
      dateTo,
      latitude,
      longitude,
      radiusKm,
      color,
      brand,
      status,
      type = 'all',
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = params;

    const results: any[] = [];
    let totalLost = 0;
    let totalFound = 0;

    const p = Number(page) || 1;
    const l = Number(limit) || 20;

    // Search Lost Items
    if (type === 'all' || type === 'lost') {
      const lostQb = this.lostItemRepo
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.images', 'images')
        .leftJoin('item.user', 'user')
        .addSelect(['user.id', 'user.fullName', 'user.avatarUrl']);

      this.applyFilters(lostQb, { query, category, color, brand, status, dateFrom, dateTo }, 'item');
      this.applyLocationFilter(lostQb, latitude, longitude, radiusKm, 'item');

      lostQb.orderBy(`item.${sortBy}`, sortOrder as 'ASC' | 'DESC');
      lostQb.skip((p - 1) * l).take(l);

      const [lostItems, lostCount] = await lostQb.getManyAndCount();
      totalLost = lostCount;

      results.push(
        ...lostItems.map((item) => ({
          ...item,
          itemType: 'lost' as const,
        })),
      );
    }

    // Search Found Items
    if (type === 'all' || type === 'found') {
      const foundQb = this.foundItemRepo
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.images', 'images')
        .leftJoin('item.user', 'user')
        .addSelect(['user.id', 'user.fullName', 'user.avatarUrl']);

      this.applyFilters(foundQb, { query, category, color, brand, status, dateFrom, dateTo }, 'item');
      this.applyLocationFilter(foundQb, latitude, longitude, radiusKm, 'item');

      foundQb.orderBy(`item.${sortBy === 'lostDate' ? 'foundDate' : sortBy}`, sortOrder as 'ASC' | 'DESC');
      foundQb.skip((p - 1) * l).take(l);

      const [foundItems, foundCount] = await foundQb.getManyAndCount();
      totalFound = foundCount;

      results.push(
        ...foundItems.map((item) => ({
          ...item,
          itemType: 'found' as const,
        })),
      );
    }

    // Sort combined results by date
    results.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'DESC' ? dateB - dateA : dateA - dateB;
    });

    const total = totalLost + totalFound;

    return {
      items: results.slice((p - 1) * l, p * l),
      meta: {
        total,
        totalLost,
        totalFound,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
        hasNext: p * l < total,
        hasPrevious: p > 1,
      },
    };
  }

  private applyFilters(
    qb: any,
    filters: {
      query?: string;
      category?: string;
      color?: string;
      brand?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    alias: string,
  ) {
    if (filters.query) {
      qb.andWhere(
        new Brackets((subQb: any) => {
          subQb
            .where(`LOWER(${alias}.itemName) LIKE LOWER(:query)`, {
              query: `%${filters.query}%`,
            })
            .orWhere(`LOWER(${alias}.description) LIKE LOWER(:query)`, {
              query: `%${filters.query}%`,
            })
            .orWhere(`LOWER(${alias}.category) LIKE LOWER(:query)`, {
              query: `%${filters.query}%`,
            });
        }),
      );
    }

    if (filters.category) {
      qb.andWhere(`${alias}.category = :category`, { category: filters.category });
    }

    if (filters.color) {
      qb.andWhere(`LOWER(${alias}.color) = LOWER(:color)`, { color: filters.color });
    }

    if (filters.brand) {
      qb.andWhere(`LOWER(${alias}.brand) LIKE LOWER(:brand)`, { brand: `%${filters.brand}%` });
    }

    if (filters.status) {
      qb.andWhere(`${alias}.status = :status`, { status: filters.status });
    }

    if (filters.dateFrom) {
      qb.andWhere(`${alias}.createdAt >= :dateFrom`, { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      qb.andWhere(`${alias}.createdAt <= :dateTo`, { dateTo: filters.dateTo });
    }
  }

  private applyLocationFilter(
    qb: any,
    latitude?: number,
    longitude?: number,
    radiusKm?: number,
    alias = 'item',
  ) {
    if (latitude && longitude && radiusKm) {
      // Haversine formula for distance calculation in PostgreSQL
      qb.andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(${alias}."locationLat")) *
            cos(radians(${alias}."locationLng") - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(${alias}."locationLat"))
          )
        ) <= :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm },
      );
    }
  }
}
