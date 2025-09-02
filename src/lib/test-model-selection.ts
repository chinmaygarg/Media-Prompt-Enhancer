// Test file for the new model capability system
import { ModelSelector, ModelSelectionCriteria } from './model-selection'
import { getModelsForOutputType } from './model-capabilities'

interface TestMediaAsset {
  id: string
  filename: string
  file_type: 'image' | 'video' | 'audio'
  mime_type: string
  file_size_bytes: number
  storage_path: string
}

// Test cases for different scenarios
export function runModelSelectionTests() {
  console.log('🧪 Running Model Selection Tests...\n')

  // Test 1: Text-to-Image with no images (should work)
  console.log('Test 1: Text-to-Image Generation')
  const test1Criteria: ModelSelectionCriteria = {
    outputType: 'text-to-image',
    qualityTier: 'social',
    platform: 'instagram'
  }
  
  const test1Assets: TestMediaAsset[] = []
  const test1Prompt = 'A beautiful sunset over mountains'
  
  try {
    const result1 = ModelSelector.selectOptimalModel(test1Prompt, test1Assets, test1Criteria)
    console.log('✅ Selected Model:', result1.selected_model.name)
    console.log('✅ Compatibility Score:', result1.compatibility.compatibility_score)
    console.log('✅ Reasoning:', result1.reasoning.slice(0, 2))
    if (result1.alternatives.cost_effective) {
      console.log('💰 Cost Alternative:', result1.alternatives.cost_effective.name)
    }
  } catch (error) {
    console.log('❌ Test 1 Failed:', error)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 2: Image-to-Image with images (should work)
  console.log('Test 2: Image-to-Image Generation')
  const test2Criteria: ModelSelectionCriteria = {
    outputType: 'image-text-to-image',
    qualityTier: 'production',
    platform: 'general'
  }
  
  const test2Assets: TestMediaAsset[] = [
    {
      id: 'test-img-1',
      filename: 'reference.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      file_size_bytes: 2048000,
      storage_path: '/test/reference.jpg'
    }
  ]
  const test2Prompt = 'Transform this image into a painting'
  
  try {
    const result2 = ModelSelector.selectOptimalModel(test2Prompt, test2Assets, test2Criteria)
    console.log('✅ Selected Model:', result2.selected_model.name)
    console.log('✅ Compatibility Score:', result2.compatibility.compatibility_score)
    console.log('✅ Reasoning:', result2.reasoning.slice(0, 2))
  } catch (error) {
    console.log('❌ Test 2 Failed:', error)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 3: Image-to-Image WITHOUT images (should show warnings/fallback)
  console.log('Test 3: Image-to-Image WITHOUT Images (Compatibility Issue)')
  const test3Criteria: ModelSelectionCriteria = {
    outputType: 'image-text-to-image',
    qualityTier: 'social',
    platform: 'general'
  }
  
  const test3Assets: TestMediaAsset[] = [] // No images provided
  const test3Prompt = 'Create a beautiful landscape'
  
  try {
    const result3 = ModelSelector.selectOptimalModel(test3Prompt, test3Assets, test3Criteria)
    console.log('✅ Selected Model:', result3.selected_model.name)
    console.log('⚠️ Compatibility Score:', result3.compatibility.compatibility_score)
    console.log('⚠️ Issues:', result3.compatibility.issues.map(i => i.message))
    console.log('💡 Suggestions:', result3.compatibility.suggestions)
  } catch (error) {
    console.log('❌ Test 3 Expected Failure:', (error as Error).message)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 4: Video generation with unsupported image format
  console.log('Test 4: Video Generation with Unsupported Format')
  const test4Criteria: ModelSelectionCriteria = {
    outputType: 'image-text-to-video',
    qualityTier: 'production',
    platform: 'youtube'
  }
  
  const test4Assets: TestMediaAsset[] = [
    {
      id: 'test-img-2',
      filename: 'reference.bmp', // BMP might not be supported by all models
      file_type: 'image',
      mime_type: 'image/bmp',
      file_size_bytes: 5120000,
      storage_path: '/test/reference.bmp'
    }
  ]
  const test4Prompt = 'Create a 10 second video from this image'
  
  try {
    const result4 = ModelSelector.selectOptimalModel(test4Prompt, test4Assets, test4Criteria)
    console.log('✅ Selected Model:', result4.selected_model.name)
    console.log('⚠️ Compatibility Score:', result4.compatibility.compatibility_score)
    console.log('⚠️ Warnings:', result4.compatibility.warnings)
    if (result4.compatibility.issues.length > 0) {
      console.log('⚠️ Issues:', result4.compatibility.issues.map(i => i.message))
    }
  } catch (error) {
    console.log('❌ Test 4 Failed:', error)
  }
  
  console.log('\n' + '='.repeat(50) + '\n')
  
  // Test 5: Show available models for each output type
  console.log('Test 5: Available Models by Output Type')
  const outputTypes = [
    'text-to-image',
    'image-text-to-image', 
    'text-to-video',
    'image-text-to-video',
    'text-to-video-audio',
    'image-text-to-video-audio'
  ]
  
  outputTypes.forEach(outputType => {
    const models = getModelsForOutputType(outputType)
    console.log(`📋 ${outputType}:`)
    models.forEach(model => {
      const imageReq = model.input_requirements.images
      const cost = model.pricing.cost_per_image || model.pricing.cost_per_second || 0
      console.log(`   • ${model.name} - Images: ${imageReq.min}-${imageReq.max}${imageReq.required ? ' (required)' : ''} - $${cost.toFixed(3)}`)
    })
    console.log('')
  })
  
  console.log('🎉 Model Selection Tests Completed!')
}

// Helper function to simulate the test
if (typeof window === 'undefined') {
  // Only run in Node.js environment, not in browser
  try {
    runModelSelectionTests()
  } catch (error) {
    console.error('Test execution failed:', error)
  }
}