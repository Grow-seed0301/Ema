#!/usr/bin/env node
/**
 * Simple verification script to check that all route modules can be imported
 * This doesn't test functionality, just that the structure is correct
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const routesDir = join(__dirname, 'server', 'routes');

async function verifyImports() {
  console.log('Verifying route module structure...\n');
  
  const modules = [
    // Main files
    { path: './server/routes/teacher.ts', name: 'Teacher main' },
    { path: './server/routes/student.ts', name: 'Student main' },
    
    // Shared modules
    { path: './server/routes/shared/auth.ts', name: 'Shared auth' },
    { path: './server/routes/shared/profile.ts', name: 'Shared profile' },
    { path: './server/routes/shared/password.ts', name: 'Shared password' },
    { path: './server/routes/shared/chat.ts', name: 'Shared chat' },
    
    // Teacher modules
    { path: './server/routes/teacher/auth.ts', name: 'Teacher auth' },
    { path: './server/routes/teacher/profile.ts', name: 'Teacher profile' },
    { path: './server/routes/teacher/password.ts', name: 'Teacher password' },
    { path: './server/routes/teacher/schedule.ts', name: 'Teacher schedule' },
    { path: './server/routes/teacher/chat.ts', name: 'Teacher chat' },
    
    // Student modules
    { path: './server/routes/student/auth.ts', name: 'Student auth' },
    { path: './server/routes/student/profile.ts', name: 'Student profile' },
    { path: './server/routes/student/password.ts', name: 'Student password' },
    { path: './server/routes/student/teachers.ts', name: 'Student teachers' },
    { path: './server/routes/student/bookings.ts', name: 'Student bookings' },
    { path: './server/routes/student/chat.ts', name: 'Student chat' },
  ];

  let success = 0;
  let failed = 0;

  for (const module of modules) {
    try {
      const path = join(__dirname, module.path.replace('./server/', 'server/'));
      
      if (fs.existsSync(path)) {
        console.log(`✓ ${module.name}: File exists`);
        success++;
      } else {
        console.log(`✗ ${module.name}: File not found`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${module.name}: Error - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total modules: ${modules.length}`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n✓ All route module files are present!');
    console.log('\nNote: This only verifies file structure.');
    console.log('Run the server to verify imports and functionality.');
    return 0;
  } else {
    console.log('\n✗ Some module files are missing!');
    return 1;
  }
}

verifyImports().then(code => process.exit(code));
