const fs = require('fs');
const files = [
  'app/eggs/page.tsx',
  'app/feed/page.tsx',
  'app/health/page.tsx',
  'app/mortality/page.tsx',
  'app/sales/page.tsx',
  'app/expenses/page.tsx',
  'app/feed-inventory/page.tsx',
  'components/operations/operations-workspace.tsx',
  'components/operations/operations-kpi-card.tsx',
  'components/operations/pagination.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/<\/arg_value>.*$/s, '');
  content = content.trimEnd() + '\n';
  fs.writeFileSync(f, content);
  console.log('Fixed: ' + f);
});
</arg_value>
<task_progress>
- [x] Explore existing operational pages (eggs, feed, health, mortality, sales, expenses, feed-inventory)
- [x] Explore existing layout components (app-shell, protected-page)
- [x] Explore existing UI components (kpi-card, save-button)
- [x] Design OperationsWorkspace component
- [x] Build OperationsWorkspace component
- [x] Create supporting components (KPI card, Pagination)
- [x] Migrate operational pages to use it
- [ ] Verify build compiles
</task_progress>
</write_to_file></tool_call>