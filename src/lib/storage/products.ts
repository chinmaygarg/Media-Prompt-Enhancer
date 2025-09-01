import { createServiceSupabase } from '../supabase'
import { Product, ProductAsset, MediaAsset } from '../../types'

export class ProductService {
  private supabase = createServiceSupabase()

  // Create new product
  async createProduct(
    userId: string,
    productData: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{
    success: boolean
    data?: Product
    error?: string
  }> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .insert({
          user_id: userId,
          ...productData
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data as Product }
    } catch (error) {
      return {
        success: false,
        error: `Product creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Get user's products
  async getUserProducts(
    userId: string,
    options?: {
      includeInactive?: boolean
      category?: string
      limit?: number
      offset?: number
    }
  ): Promise<{
    success: boolean
    data?: Product[]
    error?: string
  }> {
    try {
      let query = this.supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (!options?.includeInactive) {
        query = query.eq('is_active', true)
      }

      if (options?.category) {
        query = query.eq('category', options.category)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data as Product[] }
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Get single product by ID
  async getProduct(productId: string, userId: string): Promise<{
    success: boolean
    data?: Product & { assets?: (ProductAsset & { media_asset: MediaAsset })[] }
    error?: string
  }> {
    try {
      // Get product details
      const { data: product, error: productError } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', userId)
        .single()

      if (productError) {
        return { success: false, error: productError.message }
      }

      // Get associated assets
      const { data: assets, error: assetsError } = await this.supabase
        .from('product_assets')
        .select(`
          *,
          media_asset:media_assets(*)
        `)
        .eq('product_id', productId)
        .order('display_order')

      if (assetsError) {
        console.error('Failed to load product assets:', assetsError)
        // Still return product without assets rather than failing
      }

      return {
        success: true,
        data: {
          ...product as Product,
          assets: assets as (ProductAsset & { media_asset: MediaAsset })[] || []
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch product: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Update product
  async updateProduct(
    productId: string,
    userId: string,
    updates: Partial<Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<{
    success: boolean
    data?: Product
    error?: string
  }> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data as Product }
    } catch (error) {
      return {
        success: false,
        error: `Product update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Soft delete product (mark as inactive)
  async deleteProduct(productId: string, userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await this.supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId)
        .eq('user_id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Product deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Hard delete product and all associated data
  async permanentDeleteProduct(productId: string, userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // First, get all associated assets
      const { data: productAssets } = await this.supabase
        .from('product_assets')
        .select(`
          media_asset_id,
          media_asset:media_assets(*)
        `)
        .eq('product_id', productId)

      // Delete the product (cascade will handle product_assets)
      const { error: deleteError } = await this.supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', userId)

      if (deleteError) {
        return { success: false, error: deleteError.message }
      }

      // Note: Media assets are not auto-deleted to prevent accidental loss
      // They can be cleaned up separately or remain for reuse

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Permanent deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Add asset to product
  async addAssetToProduct(
    productId: string,
    mediaAssetId: string,
    userId: string,
    assetType: 'reference_image' | 'logo' | 'brand_asset',
    displayOrder?: number
  ): Promise<{
    success: boolean
    data?: ProductAsset
    error?: string
  }> {
    try {
      // Verify product ownership
      const { data: product } = await this.supabase
        .from('products')
        .select('id')
        .eq('id', productId)
        .eq('user_id', userId)
        .single()

      if (!product) {
        return { success: false, error: 'Product not found or access denied' }
      }

      // Verify media asset ownership
      const { data: asset } = await this.supabase
        .from('media_assets')
        .select('id')
        .eq('id', mediaAssetId)
        .eq('user_id', userId)
        .single()

      if (!asset) {
        return { success: false, error: 'Media asset not found or access denied' }
      }

      // Get next display order if not specified
      if (displayOrder === undefined) {
        const { data: lastAsset } = await this.supabase
          .from('product_assets')
          .select('display_order')
          .eq('product_id', productId)
          .order('display_order', { ascending: false })
          .limit(1)
          .single()

        displayOrder = (lastAsset?.display_order || 0) + 1
      }

      // Create product asset link
      const { data, error } = await this.supabase
        .from('product_assets')
        .insert({
          product_id: productId,
          media_asset_id: mediaAssetId,
          asset_type: assetType,
          display_order: displayOrder
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data as ProductAsset }
    } catch (error) {
      return {
        success: false,
        error: `Failed to add asset: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Remove asset from product
  async removeAssetFromProduct(
    productId: string,
    mediaAssetId: string,
    userId: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Verify product ownership
      const { data: product } = await this.supabase
        .from('products')
        .select('id')
        .eq('id', productId)
        .eq('user_id', userId)
        .single()

      if (!product) {
        return { success: false, error: 'Product not found or access denied' }
      }

      // Remove the link (doesn't delete the media asset itself)
      const { error } = await this.supabase
        .from('product_assets')
        .delete()
        .eq('product_id', productId)
        .eq('media_asset_id', mediaAssetId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove asset: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Reorder product assets
  async reorderAssets(
    productId: string,
    userId: string,
    assetOrders: { mediaAssetId: string; displayOrder: number }[]
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Verify product ownership
      const { data: product } = await this.supabase
        .from('products')
        .select('id')
        .eq('id', productId)
        .eq('user_id', userId)
        .single()

      if (!product) {
        return { success: false, error: 'Product not found or access denied' }
      }

      // Update display orders
      const updatePromises = assetOrders.map(({ mediaAssetId, displayOrder }) =>
        this.supabase
          .from('product_assets')
          .update({ display_order: displayOrder })
          .eq('product_id', productId)
          .eq('media_asset_id', mediaAssetId)
      )

      await Promise.all(updatePromises)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Failed to reorder assets: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Search products by name or category
  async searchProducts(
    userId: string,
    searchTerm: string,
    options?: {
      category?: string
      limit?: number
    }
  ): Promise<{
    success: boolean
    data?: Product[]
    error?: string
  }> {
    try {
      let query = this.supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)

      if (options?.category) {
        query = query.eq('category', options.category)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      query = query.order('updated_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data as Product[] }
    } catch (error) {
      return {
        success: false,
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Export singleton instance
export const productService = new ProductService()