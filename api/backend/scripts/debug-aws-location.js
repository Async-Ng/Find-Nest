#!/usr/bin/env node

/**
 * Debug AWS Location Service data quality
 * Compare what AWS Location returns vs what we expect
 */

import {
  LocationClient,
  SearchPlaceIndexForPositionCommand,
} from "@aws-sdk/client-location";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../src/lambda/.env") });

const locationClient = new LocationClient({ region: process.env.REGION });
const PLACE_INDEX_NAME = process.env.PLACE_INDEX_NAME;

async function debugAWSLocation() {
  console.log("🔍 Debugging AWS Location Service data...\n");

  // Test specific location
  const testLocations = [
    {
      name: "Test Location (10.75007, 106.61113)",
      lat: 10.75007,
      lng: 106.61113,
    },
  ];

  for (const location of testLocations) {
    console.log(`\n📍 Testing: ${location.name}`);
    console.log(`   Coordinates: [${location.lat}, ${location.lng}]`);
    console.log(`   Radius: 10km\n`);

    try {
      const command = new SearchPlaceIndexForPositionCommand({
        IndexName: PLACE_INDEX_NAME,
        Position: [location.lng, location.lat],
        MaxResults: 500,
      });

      const response = await locationClient.send(command);
      const places = response.Results || [];

      console.log(`   Total places found: ${places.length}\n`);

      // Categorize places
      const categories = {
        restaurants: [],
        schools: [],
        security: [],
        transport: [],
        entertainment: [],
        business: [],
        other: [],
      };

      places.forEach((result) => {
        const place = result.Place;
        const allCategories = [
          ...(place.Categories || []),
          ...(place.SupplementalCategories || []),
        ];

        const categoryStr = allCategories.join(", ").toLowerCase();

        let categorized = false;

        if (
          categoryStr.match(
            /restaurant|food|cafe|coffee|dining|eatery|beverage/
          )
        ) {
          categories.restaurants.push(place);
          categorized = true;
        }
        if (categoryStr.match(/school|university|education|college|academy/)) {
          categories.schools.push(place);
          categorized = true;
        }
        if (
          categoryStr.match(
            /police|security|hospital|clinic|pharmacy|medical|health/
          )
        ) {
          categories.security.push(place);
          categorized = true;
        }
        if (categoryStr.match(/transport|bus|metro|station|transit/)) {
          categories.transport.push(place);
          categorized = true;
        }
        if (
          categoryStr.match(
            /entertainment|cinema|theater|recreation|leisure|shopping|mall/
          )
        ) {
          categories.entertainment.push(place);
          categorized = true;
        }
        if (categoryStr.match(/office|business|commercial|corporate/)) {
          categories.business.push(place);
          categorized = true;
        }

        if (!categorized) {
          categories.other.push(place);
        }
      });

      // Display results
      console.log("   📊 Breakdown by category:");
      console.log(`   🍽️  Restaurants: ${categories.restaurants.length}`);
      console.log(`   🏫 Schools: ${categories.schools.length}`);
      console.log(`   🚔 Security: ${categories.security.length}`);
      console.log(`   🚌 Transport: ${categories.transport.length}`);
      console.log(`   🎬 Entertainment: ${categories.entertainment.length}`);
      console.log(`   🏢 Business: ${categories.business.length}`);
      console.log(`   ❓ Other: ${categories.other.length}\n`);

      // Show sample places for each category
      if (categories.schools.length > 0) {
        console.log("   🏫 Sample schools found:");
        categories.schools.slice(0, 5).forEach((p) => {
          console.log(`      - ${p.Label}`);
        });
        console.log("");
      } else {
        console.log("   ⚠️  No schools found!\n");
      }

      if (categories.entertainment.length > 0) {
        console.log("   🎬 Sample entertainment found:");
        categories.entertainment.slice(0, 5).forEach((p) => {
          console.log(`      - ${p.Label}`);
        });
        console.log("");
      } else {
        console.log("   ⚠️  No entertainment venues found!\n");
      }

      // Show all categories for debugging
      console.log("   🔍 All unique categories found:");
      const allCats = new Set();
      places.forEach((result) => {
        const place = result.Place;
        [
          ...(place.Categories || []),
          ...(place.SupplementalCategories || []),
        ].forEach((cat) => {
          allCats.add(cat);
        });
      });
      console.log("   ", Array.from(allCats).sort().join(", "));
      console.log("\n   " + "=".repeat(80));
    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
    }
  }

  console.log("\n\n💡 Conclusion:");
  console.log("   If schools/entertainment counts are 0 or very low,");
  console.log(
    "   AWS Location Service (HERE Maps) has limited POI data for Vietnam."
  );
  console.log("   Solution: Use Google Places API for better coverage.\n");
}

debugAWSLocation();
