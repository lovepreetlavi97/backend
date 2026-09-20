import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { PublicCatalogService } from './public-catalog.service';
import { FilterConfigService } from '../settings/filter-config.service';

@ApiTags('Client Public APIs')
@Controller()
export class PublicController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly publicCatalogService: PublicCatalogService,
    private readonly filterConfigService: FilterConfigService,
  ) {}

  @Get('homepage')
  @ApiOperation({ summary: 'Get homepage banners and categories' })
  async getHomepage() {
    return this.publicCatalogService.getHomepage();
  }

  @Get('categories/menu')
  @ApiOperation({ summary: 'Get category dropdown menu' })
  async getCategoryMenu(@Query('metalId') metalId?: string) {
    return this.publicCatalogService.getCategoryMenu(metalId);
  }

  @Get('curated-collections')
  @ApiOperation({ summary: 'Admin/Public: Get curated collections' })
  async getCuratedCollectionsAdmin() {
    const collections = await this.publicCatalogService.getFeaturedSubcategories(
      '/images/default-collection.jpg',
      'Exclusive curated collection',
    );
    const mapped = collections.map((c: any, index: number) => ({
      _id: c.id || c._id,
      id: c.id || c._id,
      name: c.name,
      slug: c.slug,
      image: c.image || '/images/default-collection.jpg',
      isActive: true,
      position: index + 1,
      createdAt: new Date().toISOString(),
    }));
    return {
      status: 'success',
      data: { curated: mapped, collections: mapped },
    };
  }

  @Get('curated-collections/public')
  @ApiOperation({ summary: 'Get curated collections' })
  async getCuratedCollectionsPublic() {
    const collections = await this.publicCatalogService.getFeaturedSubcategories(
      '/images/default-collection.jpg',
      'Exclusive curated collection',
    );
    return {
      status: 'success',
      data: { collections, curated: collections },
    };
  }

  @Get('user/gift/filters')
  @ApiOperation({ summary: 'Get gift page filters' })
  async getGiftFilters() {
    const config = await this.filterConfigService.getGiftStoreConfig();
    return {
      status: 'success',
      data: config,
    };
  }

  @Get('user/price-filters')
  @ApiOperation({ summary: 'Get price filters' })
  async getPriceFilters() {
    const priceFilters = await this.filterConfigService.getPriceFilters();
    return {
      status: 'success',
      data: { priceFilters },
    };
  }

  @Get('user/relations')
  @ApiOperation({ summary: 'Get gift recipients (relations)' })
  async getRelations() {
    const recipients = await this.filterConfigService.getRecipients();
    return {
      status: 'success',
      data: recipients,
    };
  }

  @Get('user/products/essentials')
  @ApiOperation({ summary: 'Get shop essentials' })
  async getEssentials(@Query('metalId') metalId?: string) {
    return this.publicCatalogService.getEssentials(metalId);
  }

  @Get('user/trending-products')
  @ApiOperation({ summary: 'Get trending products' })
  async getTrendingProducts(@Query('metalId') metalId?: string, @Query('limit') limit?: number) {
    return this.publicCatalogService.getTrendingProducts(metalId, limit ? Number(limit) : 4);
  }

  @Get('user/curated-collections')
  @ApiOperation({ summary: 'Get curated collections list' })
  async getCuratedCollections() {
    return this.publicCatalogService.getCuratedCollections();
  }

  @Get('user/festivals')
  @ApiOperation({ summary: 'Get active festivals list' })
  async getFestivals(@Query('metalId') metalId?: string) {
    return this.publicCatalogService.getFestivals(metalId);
  }

  @Get('user/home-search')
  @ApiOperation({ summary: 'Get homepage search categories and products' })
  async getHomeSearch(@Query('query') queryStr?: string) {
    return this.publicCatalogService.getHomeSearch(queryStr);
  }

  @Get('user/categories')
  @ApiOperation({ summary: 'Get list of categories (user view)' })
  async getUserCategories(@Query('metalId') metalId?: string) {
    return this.publicCatalogService.getCategoryMenu(metalId);
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

  @Get('user/related-products')
  @ApiOperation({ summary: 'Get related products based on product IDs' })
  async getRelatedProducts(@Query('ids') ids?: string) {
    return this.publicCatalogService.getRelatedProducts(ids);
  }

  @Get('user/products/:slug')
  @ApiOperation({ summary: 'Get list of products under a category or subcategory slug' })
  async getProductsByCategorySlug(
    @Param('slug') slug: string,
    @Query() query: any,
  ) {
    return this.publicCatalogService.getProductsByCategorySlug(slug, query);
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
          },
        ],
        pagination: {
          page: pageStr ? parseInt(pageStr, 10) : 1,
          limit: limitStr ? parseInt(limitStr, 10) : 6,
          total: 3,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
    };
  }
}
