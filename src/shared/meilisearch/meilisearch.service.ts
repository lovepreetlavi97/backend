import { Injectable, OnModuleInit } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const meiliModule = require('meilisearch');
const MeiliSearch = meiliModule.MeiliSearch || meiliModule.default || meiliModule;

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private meiliClient: any;
  private readonly indexName = 'products';

  constructor() {
    const host = process.env.MEILI_HOST || 'http://localhost:7700';
    const apiKey = process.env.MEILI_MASTER_KEY || 'myg_meili_master_key_2026';
    try {
      this.meiliClient = new MeiliSearch({ host, apiKey });
    } catch (e: any) {
      console.warn('⚠️ Meilisearch client init warning:', e.message);
    }
  }

  async onModuleInit() {
    if (!this.meiliClient) return;
    try {
      const index = this.meiliClient.index(this.indexName);
      await index.updateSearchableAttributes(['title', 'description', 'sku', 'slug']);
      await index.updateFilterableAttributes(['categoryId', 'subcategoryId', 'isPublished']);
      console.log('🔍 Meilisearch product index configured successfully.');
    } catch (e: any) {
      console.warn('⚠️ Meilisearch initialization notice:', e.message);
    }
  }

  async addOrUpdateProduct(product: any) {
    if (!this.meiliClient) return;
    try {
      const index = this.meiliClient.index(this.indexName);
      await index.addDocuments([
        {
          id: product.id,
          title: product.title,
          slug: product.slug,
          sku: product.sku,
          description: product.description,
          categoryId: product.categoryId,
          subcategoryId: product.subcategoryId,
          isPublished: product.isPublished,
        },
      ]);
    } catch (e) {}
  }

  async searchProducts(query: string, filters?: string) {
    if (!this.meiliClient) return { hits: [], query, limit: 20 };
    try {
      const index = this.meiliClient.index(this.indexName);
      return await index.search(query, {
        filter: filters,
        limit: 20,
      });
    } catch (e) {
      return { hits: [], query, limit: 20 };
    }
  }
}
