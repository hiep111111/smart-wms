const fs = require('fs');
const files = [
  { p: 'src/actions/products/createProduct.ts', perm: 'inventory:manage' },
  { p: 'src/actions/products/updateProduct.ts', perm: 'inventory:manage' },
  { p: 'src/actions/products/deleteProduct.ts', perm: 'inventory:manage' },
  { p: 'src/actions/locations/createLocation.ts', perm: 'locations:manage' },
  { p: 'src/actions/locations/updateLocation.ts', perm: 'locations:manage' },
  { p: 'src/actions/locations/deleteLocation.ts', perm: 'locations:manage' },
  { p: 'src/actions/inventory/createInbound.ts', perm: 'inventory:in' },
  { p: 'src/actions/inventory/createOutbound.ts', perm: 'inventory:out' },
  { p: 'src/actions/inventory/createTransfer.ts', perm: 'inventory:transfer' },
  { p: 'src/actions/reports/exportReport.ts', perm: 'report:export' },
];

for(const f of files) {
  if (!fs.existsSync(f.p)) {
    console.log('Skipping missing file', f.p);
    continue;
  }
  let content = fs.readFileSync(f.p, 'utf8');
  
  // Update imports
  content = content.replace(/import \{.*?requireSession.*?\} from ["']@\/lib\/auth\/checkPermission["'];/g, 'import { requirePermission } from "@/lib/auth/checkPermission";');
  
  // Replace const session = await requireSession(); and any following hasPermission check
  content = content.replace(/const session = await requireSession\(\);\r?\n(\s*\/?\/?if \(!hasPermission[^\n]*\r?\n)?/g, 'const session = await requirePermission("' + f.perm + '");\n');
  
  fs.writeFileSync(f.p, content);
  console.log('Processed', f.p);
}
