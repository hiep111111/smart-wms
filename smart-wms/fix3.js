const fs = require('fs');

const files = [
  {p: 'src/actions/locations/createLocation.ts', perm: 'locations:manage'},
  {p: 'src/actions/locations/deleteLocation.ts', perm: 'locations:manage'},
  {p: 'src/actions/products/createProduct.ts', perm: 'inventory:manage'},
  {p: 'src/actions/products/deleteProduct.ts', perm: 'inventory:manage'}
];

for(const f of files) {
  if (!fs.existsSync(f.p)) continue;
  let c = fs.readFileSync(f.p, 'utf8');
  c = c.replace(/await requireSession\(\)/g, 'await requirePermission("' + f.perm + '")');
  fs.writeFileSync(f.p, c);
}

let getProd = fs.readFileSync('src/actions/products/getProduct.ts', 'utf8');
getProd = getProd.replace(/import \{ requireSession, hasPermission \} from ["']@\/lib\/auth\/checkPermission["'];/, 'import { requirePermission } from "@/lib/auth/checkPermission";');
// The commented out line: // if (!hasPermission(session, "inventory:view")) throw new Error("FORBIDDEN");
getProd = getProd.replace(/const session = await requireSession\(\);\r?\n(\s*\/?\/?if \(!hasPermission[^\n]*\r?\n)?/g, 'const session = await requirePermission("inventory:view");\n');
fs.writeFileSync('src/actions/products/getProduct.ts', getProd);

let getLoc = fs.readFileSync('src/actions/locations/getLocation.ts', 'utf8');
getLoc = getLoc.replace(/import \{ requireSession, hasPermission \} from ["']@\/lib\/auth\/checkPermission["'];/, 'import { requirePermission } from "@/lib/auth/checkPermission";');
getLoc = getLoc.replace(/const session = await requireSession\(\);\r?\n(\s*\/?\/?if \(!hasPermission[^\n]*\r?\n)?/g, 'const session = await requirePermission("locations:view");\n');
fs.writeFileSync('src/actions/locations/getLocation.ts', getLoc);
