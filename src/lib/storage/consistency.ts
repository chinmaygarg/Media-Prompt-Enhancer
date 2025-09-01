import { createServiceSupabase } from '../supabase'
import { ConsistencyObject, ConsistencyObjectAsset, MediaAsset } from '../../types'

export class ConsistencyObjectService {
  private supabase = createServiceSupabase()

  // Create new consistency object (character, scene, or style)
  async createConsistencyObject(
    userId: string,
    objectData: Omit<ConsistencyObject, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{
    success: boolean
    data?: ConsistencyObject
    error?: string
  }> {
    try {
      const { data, error } = await this.supabase
        .from('consistency_objects')
        .insert({
          user_id: userId,
          ...objectData
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data as ConsistencyObject }
    } catch (error) {
      return {
        success: false,
        error: `Consistency object creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Get user's consistency objects
  async getUserConsistencyObjects(
    userId: string,
    options?: {
      type?: 'character' | 'scene' | 'style'
      includeInactive?: boolean
      limit?: number
      offset?: number
    }
  ): Promise<{
    success: boolean
    data?: ConsistencyObject[]
    error?: string
  }> {
    try {
      let query = this.supabase
        .from('consistency_objects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (options?.type) {
        query = query.eq('object_type', options.type)
      }

      if (!options?.includeInactive) {
        query = query.eq('is_active', true)
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

      return { success: true, data: data as ConsistencyObject[] }
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch consistency objects: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Get single consistency object by ID with assets
  async getConsistencyObject(objectId: string, userId: string): Promise<{
    success: boolean
    data?: ConsistencyObject & { assets?: (ConsistencyObjectAsset & { media_asset: MediaAsset })[] }
    error?: string
  }> {
    try {
      // Get object details
      const { data: object, error: objectError } = await this.supabase
        .from('consistency_objects')
        .select('*')
        .eq('id', objectId)
        .eq('user_id', userId)
        .single()

      if (objectError) {
        return { success: false, error: objectError.message }
      }

      // Get associated assets
      const { data: assets, error: assetsError } = await this.supabase
        .from('consistency_object_assets')
        .select(`
          *,
          media_asset:media_assets(*)
        `)
        .eq('consistency_object_id', objectId)
        .order('created_at')

      if (assetsError) {
        console.error('Failed to load consistency object assets:', assetsError)
        // Still return object without assets rather than failing
      }

      return {
        success: true,
        data: {
          ...object as ConsistencyObject,
          assets: assets as (ConsistencyObjectAsset & { media_asset: MediaAsset })[] || []
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch consistency object: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Update consistency object
  async updateConsistencyObject(
    objectId: string,
    userId: string,
    updates: Partial<Omit<ConsistencyObject, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<{
    success: boolean
    data?: ConsistencyObject
    error?: string
  }> {
    try {
      const { data, error } = await this.supabase
        .from('consistency_objects')
        .update(updates)
        .eq('id', objectId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data as ConsistencyObject }
    } catch (error) {
      return {
        success: false,
        error: `Consistency object update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Soft delete consistency object (mark as inactive)
  async deleteConsistencyObject(objectId: string, userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await this.supabase
        .from('consistency_objects')
        .update({ is_active: false })
        .eq('id', objectId)
        .eq('user_id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Consistency object deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Add asset to consistency object
  async addAssetToConsistencyObject(
    objectId: string,
    mediaAssetId: string,
    userId: string
  ): Promise<{
    success: boolean
    data?: ConsistencyObjectAsset
    error?: string
  }> {
    try {
      // Verify object ownership
      const { data: object } = await this.supabase
        .from('consistency_objects')
        .select('id')
        .eq('id', objectId)
        .eq('user_id', userId)
        .single()

      if (!object) {
        return { success: false, error: 'Consistency object not found or access denied' }
      }

      // Verify media asset ownership
      const { data: asset } = await this.supabase
        .from('media_assets')
        .select('id, file_type')
        .eq('id', mediaAssetId)
        .eq('user_id', userId)
        .single()

      if (!asset) {
        return { success: false, error: 'Media asset not found or access denied' }
      }

      // Only allow images for consistency objects
      if (asset.file_type !== 'image') {
        return { success: false, error: 'Only images are allowed for consistency objects' }
      }

      // Create consistency object asset link
      const { data, error } = await this.supabase
        .from('consistency_object_assets')
        .insert({
          consistency_object_id: objectId,
          media_asset_id: mediaAssetId
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data as ConsistencyObjectAsset }
    } catch (error) {
      return {
        success: false,
        error: `Failed to add asset: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Remove asset from consistency object
  async removeAssetFromConsistencyObject(
    objectId: string,
    mediaAssetId: string,
    userId: string
  ): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Verify object ownership
      const { data: object } = await this.supabase
        .from('consistency_objects')
        .select('id')
        .eq('id', objectId)
        .eq('user_id', userId)
        .single()

      if (!object) {
        return { success: false, error: 'Consistency object not found or access denied' }
      }

      // Remove the link (doesn't delete the media asset itself)
      const { error } = await this.supabase
        .from('consistency_object_assets')
        .delete()
        .eq('consistency_object_id', objectId)
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

  // Create character card (specialized consistency object)
  async createCharacterCard(
    userId: string,
    characterData: {
      name: string
      description: string
      appearance: string[]  // ["blue eyes", "red hair", "tall"]
      personality?: string
      background?: string
      referenceImages?: string[] // Media asset IDs
    }
  ): Promise<{
    success: boolean
    data?: ConsistencyObject
    error?: string
  }> {
    try {
      // Create the consistency object
      const objectResult = await this.createConsistencyObject(userId, {
        name: characterData.name,
        object_type: 'character',
        description: characterData.description,
        locked_attributes: characterData.appearance,
        style_notes: [characterData.personality, characterData.background].filter(Boolean).join('\n'),
        is_active: true
      })

      if (!objectResult.success || !objectResult.data) {
        return objectResult
      }

      // Add reference images if provided
      if (characterData.referenceImages && characterData.referenceImages.length > 0) {
        for (const imageId of characterData.referenceImages) {
          await this.addAssetToConsistencyObject(objectResult.data.id, imageId, userId)
        }
      }

      return objectResult
    } catch (error) {
      return {
        success: false,
        error: `Character card creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Generate consistency prompt for use in enhancement
  async generateConsistencyPrompt(
    objectIds: string[],
    userId: string
  ): Promise<{
    success: boolean
    data?: {
      prompt: string
      objects: ConsistencyObject[]
    }
    error?: string
  }> {
    try {
      // Get all consistency objects
      const objects: ConsistencyObject[] = []
      
      for (const objectId of objectIds) {
        const result = await this.getConsistencyObject(objectId, userId)
        if (result.success && result.data) {
          objects.push(result.data)
        }
      }

      if (objects.length === 0) {
        return { success: false, error: 'No valid consistency objects found' }
      }

      // Generate combined prompt
      let prompt = ""

      const characters = objects.filter(obj => obj.object_type === 'character')
      const scenes = objects.filter(obj => obj.object_type === 'scene')
      const styles = objects.filter(obj => obj.object_type === 'style')

      if (characters.length > 0) {
        prompt += "CHARACTER CONSISTENCY:\n"
        characters.forEach(char => {
          prompt += `- ${char.name}: ${char.description}`
          if (char.locked_attributes.length > 0) {
            prompt += ` [LOCKED: ${char.locked_attributes.join(', ')}]`
          }
          prompt += "\n"
        })
        prompt += "\n"
      }

      if (scenes.length > 0) {
        prompt += "SCENE CONSISTENCY:\n"
        scenes.forEach(scene => {
          prompt += `- ${scene.name}: ${scene.description}`
          if (scene.locked_attributes.length > 0) {
            prompt += ` [REQUIRED: ${scene.locked_attributes.join(', ')}]`
          }
          prompt += "\n"
        })
        prompt += "\n"
      }

      if (styles.length > 0) {
        prompt += "STYLE CONSISTENCY:\n"
        styles.forEach(style => {
          prompt += `- ${style.name}: ${style.description}`
          if (style.locked_attributes.length > 0) {
            prompt += ` [MAINTAIN: ${style.locked_attributes.join(', ')}]`
          }
          prompt += "\n"
        })
        prompt += "\n"
      }

      return {
        success: true,
        data: {
          prompt: prompt.trim(),
          objects
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate consistency prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Search consistency objects
  async searchConsistencyObjects(
    userId: string,
    searchTerm: string,
    options?: {
      type?: 'character' | 'scene' | 'style'
      limit?: number
    }
  ): Promise<{
    success: boolean
    data?: ConsistencyObject[]
    error?: string
  }> {
    try {
      let query = this.supabase
        .from('consistency_objects')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)

      if (options?.type) {
        query = query.eq('object_type', options.type)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      query = query.order('updated_at', { ascending: false })

      const { data, error } = await query

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data as ConsistencyObject[] }
    } catch (error) {
      return {
        success: false,
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Export singleton instance
export const consistencyObjectService = new ConsistencyObjectService()