import { neon } from '@neondatabase/serverless';

const original = "postgresql://neondb_owner:npg_1rAmlWv4fhDj@ep-rough-glitter-akbjt9vs.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Try different variations of the string
const variations = [
  original,
  "postgresql://neondb_owner:npg_1rAmlWv4fhDj@ep-rough-glitter-akbjt9vs.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require",
  "postgresql://neondb_owner:npg_1rAmlWv4fhDj@ep-rough-glitter-akbjt9vs.c-3.us-west-2.aws.neon.tech/neondb",
  "postgres://neondb_owner:npg_1rAmlWv4fhDj@ep-rough-glitter-akbjt9vs.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require"
];

for (const variant of variations) {
  try {
    console.log(`Testing: ${variant}`);
    const sql = neon(variant);
    console.log("Success creating neon client!");
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}
