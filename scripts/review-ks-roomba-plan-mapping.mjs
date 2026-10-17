// Offline only: node scripts/review-ks-roomba-plan-mapping.mjs INPUT.json OUTPUT.json
import fs from 'node:fs';
import { buildPaidPlanMapping } from '../_server/ks-roomba-plan-mapping.js';

const [inputPath, outputPath, ...extra] = process.argv.slice(2);
if (!inputPath || !outputPath || extra.length) throw new Error('Provide the package-summary path and a new mapping-output path.');
const input = fs.readFileSync(inputPath);
if (input.length > 4 * 1024 * 1024) throw new Error('Package summary is too large.');
const mapping = buildPaidPlanMapping(JSON.parse(input.toString('utf8')));
fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
console.log(`${mapping.entries.length} standard plan/connection combinations matched. Draft saved; paid provisioning remains disabled.`);
console.log('No provider calls, database writes, emails, payments or credit debits.');
