#!/usr/bin/env node

/**
 * Test script to verify areaContext calculation
 * Usage: node test-area-context.js
 */

const API_BASE = 'http://localhost:3001';

async function testAreaContext() {
  console.log('🧪 Testing areaContext calculation...\n');

  try {
    // Step 1: Get a listing in Ho Chi Minh City
    console.log('📋 Step 1: Fetching a sample listing in Ho Chi Minh City...');
    const listingsRes = await fetch(`${API_BASE}/listings`);
    const listings = await listingsRes.json();
    
    if (!listings || listings.length === 0) {
      console.error('❌ No listings found in database');
      return;
    }

    // Find a listing in HCM
    const hcmListing = listings.find(l => 
      l.address?.city?.toLowerCase().includes('hồ chí minh') ||
      l.address?.city?.toLowerCase().includes('ho chi minh') ||
      l.address?.city?.toLowerCase().includes('hcm')
    );
    
    const listing = hcmListing || listings[0];
    
    if (!hcmListing) {
      console.log('⚠️  No HCM listing found, using first available listing');
    }
    console.log(`✅ Found listing: ${listing.title}`);
    console.log(`   ID: ${listing.listingId}`);
    console.log(`   Location: [${listing.location?.latitude}, ${listing.location?.longitude}]`);
    console.log(`   Address: ${listing.address?.street}, ${listing.address?.district}, ${listing.address?.city}\n`);

    // Step 2: Check current areaContext
    console.log('📋 Step 2: Checking current areaContext...');
    const contextRes = await fetch(`${API_BASE}/admin/listings/${listing.listingId}/area-context`);
    const contextData = await contextRes.json();
    
    if (contextData.areaContext) {
      console.log('✅ Current areaContext:');
      console.log(JSON.stringify(contextData.areaContext, null, 2));
    } else {
      console.log('⚠️  No areaContext found');
    }
    console.log('');

    // Step 3: Analyze current areaContext
    console.log('📋 Step 3: Analyzing areaContext data...\n');
    
    if (contextData.areaContext) {
      console.log('✅ Detailed areaContext breakdown:');
      const ac = contextData.areaContext;
      console.log(`   🍽️  Restaurants: ${ac.restaurantCount}`);
      console.log(`   🏫 Schools: ${ac.schoolCount}`);
      console.log(`   🚔 Security Score: ${ac.securityScore}/10`);
      console.log(`   🚌 Transport Score: ${ac.transportScore}/10`);
      console.log(`   🏢 Business Score: ${ac.businessScore}/10`);
      console.log(`   🔊 Noise Level: ${ac.noiseLevel}/10 (lower = quieter)`);
      console.log(`   📅 Last Enriched: ${ac.lastEnriched}\n`);

      // Step 5: Verify on Google Maps
      // Step 4: Verification instructions
      console.log('📋 Step 4: Verification instructions:');
      console.log(`   Open Google Maps at: https://www.google.com/maps/@${listing.location.latitude},${listing.location.longitude},15z`);
      console.log(`   Search for "restaurants near me" and compare count`);
      console.log(`   Search for "schools near me" and compare count\n`);

      // Step 5: Summary
      console.log('📊 Summary:');
      if (ac.restaurantCount > 0 || ac.schoolCount > 0) {
        console.log('✅ areaContext calculation appears to be working!');
        console.log(`   Found ${ac.restaurantCount} restaurants and ${ac.schoolCount} schools within 10km radius`);
      } else {
        console.log('⚠️  Warning: No nearby places found. This could mean:');
        console.log('   - Location is in a remote area');
        console.log('   - Amazon Location Service data is limited for this area');
        console.log('   - There might be an issue with the calculation');
      }
    } else {
      console.log('⚠️  No areaContext found. To generate it:');
      console.log(`   curl -X POST '${API_BASE}/admin/system/refresh-area-data?force=true'`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run test
testAreaContext();
