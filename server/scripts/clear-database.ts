#!/usr/bin/env tsx

import { db } from "../db.js";
import { mobiles, brands } from "../../shared/schema.js";

async function clearDatabase() {
  console.log("🗑️  Clearing existing mobile data...");
  
  try {
    await db.delete(mobiles);
    console.log("✅ All mobiles deleted");
    
    await db.delete(brands);
    console.log("✅ All brands deleted");
    
    console.log("🎉 Database cleared successfully!");
  } catch (error) {
    console.error("❌ Failed to clear database:", error);
    process.exit(1);
  }
}

clearDatabase().then(() => {
  console.log("🏁 Database clearing completed!");
  process.exit(0);
});