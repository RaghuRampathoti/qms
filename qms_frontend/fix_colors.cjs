const fs = require('fs');

const files = [
  'src/components/Header.jsx',
  'src/components/Sidebar.jsx',
  'src/components/Notification.jsx',
  'src/pages/AdminDashboard.jsx',
  'src/pages/ManageCabins.jsx',
  'src/pages/ManageUsers.jsx',
  'src/pages/ManageCandidates.jsx',
  'src/pages/ManageFeedback.jsx',
  'src/pages/InterviewerDashboard.jsx',
  'src/pages/CandidateRegisterPage.jsx',
  'src/pages/InterviewerFeedback.jsx',
  'src/pages/LoginPage.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Fix alert box colors
  content = content.replace(/text-emerald-300/g, 'text-emerald-700');
  content = content.replace(/text-amber-300/g, 'text-amber-700');
  content = content.replace(/text-red-400/g, 'text-red-600');
  content = content.replace(/text-red-300/g, 'text-red-700');
  content = content.replace(/text-blue-300/g, 'text-blue-700');
  content = content.replace(/text-blue-200/g, 'text-blue-800');
  
  content = content.replace(/bg-blue-500\/10/g, 'bg-blue-50');
  content = content.replace(/border-blue-500\/20/g, 'border-blue-100');
  
  content = content.replace(/bg-amber-500\/10/g, 'bg-amber-50');
  content = content.replace(/border-amber-500\/20/g, 'border-amber-100');
  
  content = content.replace(/bg-red-500\/10/g, 'bg-red-50');
  content = content.replace(/border-red-500\/20/g, 'border-red-100');
  
  content = content.replace(/bg-emerald-500\/10/g, 'bg-emerald-50');
  content = content.replace(/border-emerald-500\/20/g, 'border-emerald-100');

  // Fix blue box text colors
  content = content.replace(/bg-blue-600([^>]+)text-slate-900/g, 'bg-blue-600$1text-white');
  content = content.replace(/bg-blue-600([^>]+)text-slate-600/g, 'bg-blue-600$1text-white');
  
  // Specific fixes
  content = content.replace(/text-white text-xs font-bold uppercase tracking-widest mb-2/g, 'text-blue-200 text-xs font-bold uppercase tracking-widest mb-2'); // Your token label
  content = content.replace(/text-white text-xs\">\{result\.status\}/g, 'text-blue-200 text-xs\">{result.status}'); // status label

  fs.writeFileSync(file, content);
});
