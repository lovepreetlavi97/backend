import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

@ApiTags('Client Public APIs')
@Controller()
export class PublicController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) { }

  private mapProduct(product: any) {
    const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
    const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
    const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
    const discountPercent = product.priceRule ? Number(product.priceRule.discountPercent) : 0.0;

    const priceBreakdown = this.productsService.calculatePrice(
      Number(product.weightGrams),
      ratePerGram,
      makingCharge,
      gstPercent,
      discountPercent
    );

    return {
      _id: product.id,
      name: product.title,
      slug: product.slug,
      description: product.description,
      mainImage: product.images[0] || '',
      images: product.images,
      weightGrams: product.weightGrams,
      stock: product.stockQuantity,
      isActive: product.isActive,
      isPublished: product.isPublished,
      metalId: product.metalId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      priceRuleId: product.priceRuleId,
      calculatedPrice: priceBreakdown,
      metal: product.metal,
      category: product.category,
      subcategory: product.subcategory,
      priceRule: product.priceRule,
    };
  }

  @Get('homepage')
  @ApiOperation({ summary: 'Get homepage banners and categories' })
  async getHomepage() {
    const banners = await this.prisma.banner.findMany({
      where: { isDeleted: false, status: 'active' },
      orderBy: { position: 'asc' },
    });

    const categories = await this.prisma.category.findMany({
      where: { isDeleted: false },
      include: { subcategories: { where: { isDeleted: false } } },
    });

    const rawProducts = await this.prisma.product.findMany({
      where: { isDeleted: false, isPublished: true },
      include: { category: true, subcategory: true, metal: true, priceRule: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const products = rawProducts.map(p => this.mapProduct(p));

    return {
      status: 'success',
      data: {
        banners,
        categories,
        featuredProducts: products,
        newArrivals: products,
      },
    };
  }

  @Get('categories/menu')
  @ApiOperation({ summary: 'Get category dropdown menu' })
  async getCategoryMenu() {
    const categories = await this.prisma.category.findMany({
      where: { isDeleted: false },
      include: { subcategories: { where: { isDeleted: false } } },
      orderBy: { name: 'asc' },
    });
    return {
      status: 'success',
      data: categories,
    };
  }

  @Get('curated-collections/public')
  @ApiOperation({ summary: 'Get curated collections' })
  async getCuratedCollectionsPublic() {
    const subcategories = await this.prisma.subCategory.findMany({
      where: { isDeleted: false },
      take: 5,
    });
    const collections = subcategories.map(sub => ({
      _id: sub.id,
      name: sub.name,
      slug: sub.slug,
      image: sub.image || '/images/default-collection.jpg',
      description: sub.description || 'Exclusive curated collection',
    }));
    return {
      status: 'success',
      data: {
        collections,
      },
    };
  }

  @Get('user/gift/filters')
  @ApiOperation({ summary: 'Get gift page filters' })
  async getGiftFilters() {
    return {
      status: 'success',
      data: {
        banner: {
          title: 'The Gift Store',
          description: 'Discover the art of giving with our curated collections for every milestone.',
          imageUrl: '/uploads/gifts/gift_store_banner.png',
        },
        occasions: [
          { _id: '1', name: 'Anniversary', slug: 'anniversary', image: '/uploads/gifts/anniversary.png' },
          { _id: '2', name: 'Birthday', slug: 'birthday', image: '/uploads/gifts/birthday.png' },
          { _id: '3', name: 'Valentine\'s Day', slug: 'valentines-day', image: '/uploads/gifts/valentine.png' },
          { _id: '4', name: 'Wedding', slug: 'wedding', image: '/uploads/gifts/wedding.png' },
        ],
        priceFilters: [
          { _id: '1', min: 0, max: 10000, label: 'Under ₹10,000' },
          { _id: '2', min: 10000, max: 25000, label: '₹10,000 - ₹25,000' },
          { _id: '3', min: 25000, max: 50000, label: '₹25,000 - ₹50,000' },
          { _id: '4', min: 50000, max: 100000, label: '₹50,000 - ₹1,00,000' },
          { _id: '5', min: 100000, max: 9999999, label: 'Above ₹1,00,000' },
        ],
        recipients: [
          { _id: '1', name: 'Wife', slug: 'wife' },
          { _id: '2', name: 'Husband', slug: 'husband' },
          { _id: '3', name: 'Mother', slug: 'mother' },
          { _id: '4', name: 'Daughter', slug: 'daughter' },
          { _id: '5', name: 'Friend', slug: 'friend' },
        ],
      },
    };
  }

  @Get('user/price-filters')
  @ApiOperation({ summary: 'Get price filters' })
  async getPriceFilters() {
    return {
      status: 'success',
      data: {
        priceFilters: [
          { _id: '1', min: 0, max: 10000, label: 'Under ₹10,000' },
          { _id: '2', min: 10000, max: 25000, label: '₹10,000 - ₹25,000' },
          { _id: '3', min: 25000, max: 50000, label: '₹25,000 - ₹50,000' },
          { _id: '4', min: 50000, max: 100000, label: '₹50,000 - ₹1,00,000' },
          { _id: '5', min: 100000, max: 9999999, label: 'Above ₹1,00,000' },
        ],
      },
    };
  }

  @Get('user/relations')
  @ApiOperation({ summary: 'Get gift recipients (relations)' })
  async getRelations() {
    return {
      status: 'success',
      data: [
        { _id: '1', name: 'Wife', slug: 'wife' },
        { _id: '2', name: 'Husband', slug: 'husband' },
        { _id: '3', name: 'Mother', slug: 'mother' },
        { _id: '4', name: 'Daughter', slug: 'daughter' },
        { _id: '5', name: 'Friend', slug: 'friend' },
      ],
    };
  }

  @Get('user/products/essentials')
  @ApiOperation({ summary: 'Get shop essentials' })
  async getEssentials() {
    const rawProducts = await this.prisma.product.findMany({
      where: { isDeleted: false, isPublished: true },
      include: { category: true, subcategory: true, metal: true, priceRule: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const products = rawProducts.map(p => this.mapProduct(p));
    return {
      status: 'success',
      data: {
        products,
      },
    };
  }

  @Get('user/trending-products')
  @ApiOperation({ summary: 'Get trending products' })
  async getTrendingProducts(@Query('metalId') metalId?: string) {
    const rawProducts = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
        metalId: metalId || undefined,
      },
      include: { category: true, subcategory: true, metal: true, priceRule: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const products = rawProducts.map(p => this.mapProduct(p));
    return {
      status: 'success',
      data: {
        products,
      },
    };
  }

  @Get('user/curated-collections')
  @ApiOperation({ summary: 'Get curated collections list' })
  async getCuratedCollections() {
    const subcategories = await this.prisma.subCategory.findMany({
      where: { isDeleted: false },
      take: 5,
    });
    const curatedCollections = subcategories.map(sub => ({
      _id: sub.id,
      name: sub.name,
      slug: sub.slug,
      image: sub.image || '/images/default-collection.jpg',
      description: sub.description || 'Exclusive curated collection',
    }));
    return {
      status: 'success',
      data: {
        curatedCollections,
      },
    };
  }

  @Get('user/festivals')
  @ApiOperation({ summary: 'Get active festivals list' })
  async getFestivals() {
    const subcategories = await this.prisma.subCategory.findMany({
      where: { isDeleted: false },
      take: 5,
    });
    const festivals = subcategories.map(sub => ({
      _id: sub.id,
      name: sub.name,
      slug: sub.slug,
      mainImage: sub.image || '/images/default-festival.jpg',
      description: sub.description || 'Celebrate seasons with luxury',
    }));
    return {
      status: 'success',
      data: {
        festivals,
      },
    };
  }

  @Get('user/home-search')
  @ApiOperation({ summary: 'Get homepage search categories and products' })
  async getHomeSearch(@Query('query') queryStr?: string) {
    const subcategories = await this.prisma.subCategory.findMany({
      where: {
        isDeleted: false,
        name: queryStr ? { contains: queryStr, mode: 'insensitive' } : undefined,
      },
      take: 5,
    });
    const rawProducts = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
        OR: queryStr ? [
          { title: { contains: queryStr, mode: 'insensitive' } },
          { description: { contains: queryStr, mode: 'insensitive' } },
        ] : undefined,
      },
      include: { category: true, subcategory: true, metal: true, priceRule: true },
      take: 10,
    });
    const products = rawProducts.map(p => this.mapProduct(p));
    return {
      status: 'success',
      data: {
        subcategories,
        products,
      },
    };
  }

  @Get('user/categories')
  @ApiOperation({ summary: 'Get list of categories (user view)' })
  async getUserCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isDeleted: false },
      include: { subcategories: { where: { isDeleted: false } } },
    });
    return {
      status: 'success',
      data: { categories },
    };
  }

  @Get('user/product/:slug')
  @ApiOperation({ summary: 'Get single product details by slug' })
  async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.productsService.findBySlug(slug);
    return {
      status: 'success',
      data: { product },
    };
  }

  @Get('user/products/:slug')
  @ApiOperation({ summary: 'Get list of products under a category or subcategory slug' })
  async getProductsByCategorySlug(@Param('slug') slug: string) {
    if (slug === 'all') {
      const rawProducts = await this.prisma.product.findMany({
        where: { isDeleted: false, isPublished: true },
        include: { category: true, subcategory: true, metal: true, priceRule: true },
        orderBy: { createdAt: 'desc' },
      });
      const products = rawProducts.map(product => {
        const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
        const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
        const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
        const discountPercent = product.priceRule ? Number(product.priceRule.discountPercent) : 0.0;

        const priceBreakdown = this.productsService.calculatePrice(
          Number(product.weightGrams),
          ratePerGram,
          makingCharge,
          gstPercent,
          discountPercent
        );

        return {
          ...product,
          calculatedPrice: priceBreakdown
        };
      });

      return {
        status: 'success',
        data: {
          products,
          hasMore: false,
        },
      };
    }

    // 1. Try category
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isDeleted: false, isPublished: true },
          include: { category: true, subcategory: true, metal: true, priceRule: true },
        },
      },
    });

    if (category) {
      const products = category.products.map(product => {
        const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
        const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
        const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
        const discountPercent = product.priceRule ? Number(product.priceRule.discountPercent) : 0.0;

        const priceBreakdown = this.productsService.calculatePrice(
          Number(product.weightGrams),
          ratePerGram,
          makingCharge,
          gstPercent,
          discountPercent
        );

        return {
          ...product,
          calculatedPrice: priceBreakdown
        };
      });

      return {
        status: 'success',
        data: {
          products,
          hasMore: false,
        },
      };
    }

    // 2. Try subcategory
    const subcategory = await this.prisma.subCategory.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isDeleted: false, isPublished: true },
          include: { category: true, subcategory: true, metal: true, priceRule: true },
        },
      },
    });

    if (subcategory) {
      const products = subcategory.products.map(product => {
        const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
        const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
        const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
        const discountPercent = product.priceRule ? Number(product.priceRule.discountPercent) : 0.0;

        const priceBreakdown = this.productsService.calculatePrice(
          Number(product.weightGrams),
          ratePerGram,
          makingCharge,
          gstPercent,
          discountPercent
        );

        return {
          ...product,
          calculatedPrice: priceBreakdown
        };
      });

      return {
        status: 'success',
        data: {
          products,
          hasMore: false,
        },
      };
    }

    return {
      status: 'success',
      data: {
        products: [],
        hasMore: false,
      },
    };
  }

  @Get('instagram-videos')
  @ApiOperation({ summary: 'Get Instagram reels/videos' })
  async getInstagramVideos(@Query('page') pageStr?: string, @Query('limit') limitStr?: string) {
    return {
      status: 'success',
      data: {
        videos: [
          {
            _id: '1',
            caption: 'Timeless Gold Crafts #GuruJewellers',
            instagramLink: 'https://instagram.com/gurujewellers',
            videoUrl: '/images/gifts/valentine.png',
            thumbnail: '/images/gifts/valentine.png',
          },
          {
            _id: '2',
            caption: 'Handcrafted Heritage Royal Collection',
            instagramLink: 'https://instagram.com/gurujewellers',
            videoUrl: '/images/gifts/wedding.png',
            thumbnail: '/images/gifts/wedding.png',
          },
          {
            _id: '3',
            caption: 'Bespoke Custom Jewellery Designs',
            instagramLink: 'https://instagram.com/gurujewellers',
            videoUrl: '/images/gifts/birthday.png',
            thumbnail: '/images/gifts/birthday.png',
          }
        ],
        pagination: {
          page: pageStr ? parseInt(pageStr, 10) : 1,
          limit: limitStr ? parseInt(limitStr, 10) : 6,
          total: 3,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        }
      }
    };
  }
}
