#!/usr/bin/env node

/**
 * Apply Image Optimization - Phase 3 Part 2
 * Migrates Image components to use optimization library
 * 
 * Usage: node scripts/apply-image-optimization.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

// Components that use images
const imagePatterns = [
  'src/components/**/*.tsx',
  'src/app/**/page.tsx',
  'src/app/**/*.tsx'
];

async function applyImageOptimization() {
  console.log('🖼️  Starting Image Optimization Application...\n');

  try {
    // Find all component files
    const files = glob.sync(imagePatterns, {
      cwd: projectRoot,
      ignore: ['**/node_modules/**', '**/*.test.tsx', '**/__tests__/**']
    });

    console.log(`📋 Found ${files.length} component files to analyze\n`);

    let optimizedCount = 0;
    const results = [];

    for (const file of files) {
      const filePath = path.join(projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check if file uses Image component or img tags
      if (!content.includes('<Image') && !content.includes('<img')) {
        continue;
      }

      // Check if already using optimization
      if (content.includes('OptimizedProductImage') || 
          content.includes('OptimizedHeroImage') ||
          content.includes('from \'@/lib/imageOptimization\'')) {
        results.push({
          file: file.replace(projectRoot, ''),
          status: '✅ Already optimized'
        });
        optimizedCount++;
        continue;
      }

      // Prepare for optimization (manual review needed)
      results.push({
        file: file.replace(projectRoot, ''),
        status: '⚠️  Needs manual review',
        recommendation: 'Replace Image/img tags with OptimizedProductImage, OptimizedHeroImage, etc.'
      });
    }

    console.log('📊 Image Optimization Analysis Results');
    console.log('='.repeat(60));
    
    let alreadyOptimized = 0;
    let needsReview = 0;

    results.forEach(r => {
      console.log(`${r.status} - ${r.file}`);
      if (r.status.includes('Already')) alreadyOptimized++;
      if (r.status.includes('Needs')) needsReview++;
    });

    console.log('\n' + '='.repeat(60));
    console.log(`📈 Summary`);
    console.log('='.repeat(60));
    console.log(`✅ Already optimized: ${alreadyOptimized}`);
    console.log(`⚠️  Needs review:     ${needsReview}`);
    console.log(`📊 Total analyzed:    ${results.length}`);

    console.log('\n📝 Next Steps:');
    console.log('   1. Review components marked "Needs review"');
    console.log('   2. Import optimization utilities:');
    console.log('      import { OptimizedProductImage, OptimizedHeroImage } from \'@/lib/imageOptimization\'');
    console.log('   3. Replace <Image> and <img> tags with optimized versions');
    console.log('   4. Run tests to verify: npm test -- imageOptimization');
    console.log('   5. Check performance: npm run build && npm start');

    console.log('\n✨ Image optimization guidance ready!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  applyImageOptimization();
}

module.exports = { applyImageOptimization };
