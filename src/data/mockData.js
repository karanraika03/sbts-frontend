export const customers = [
  { id: 1, code: "SBTS-001", name: "Usha Kadian", phone: "98000 12010", email: "usha.kadian@email.com", city: "Hisar", joined: "02 Nov 2026", jobs: 3 },
  { id: 2, code: "SBTS-002", name: "Sumit Dalal", phone: "98000 12012", email: "sumit.dalal@email.com", city: "Hisar", joined: "02 Nov 2026", jobs: 2 },
  { id: 3, code: "SBTS-003", name: "Pradeep Beniwal", phone: "98000 12020", email: "pradeep@email.com", city: "Hisar", joined: "01 Nov 2026", jobs: 1 },
  { id: 4, code: "SBTS-004", name: "Arjun Jangra", phone: "98000 12021", email: "", city: "Hisar", joined: "31 Oct 2026", jobs: 4 },
  { id: 5, code: "SBTS-005", name: "Sonia Kumar", phone: "98000 12022", email: "sonia@email.com", city: "Gangua", joined: "30 Oct 2026", jobs: 1 },
  { id: 6, code: "SBTS-006", name: "Sanjay Saini", phone: "98000 12025", email: "", city: "Hisar", joined: "29 Oct 2026", jobs: 2 },
];

export const jobs = [
  { id: "JOB-1024", customer: "Usha Kadian", device: "HP Pavilion 15", issue: "Laptop not starting", status: "Diagnosing", priority: "High", amount: 1800, date: "03 Nov 2026" },
  { id: "JOB-1023", customer: "Sumit Dalal", device: "Dell Inspiron 3511", issue: "Screen replacement", status: "Awaiting Parts", priority: "Medium", amount: 4500, date: "03 Nov 2026" },
  { id: "JOB-1022", customer: "Pradeep Beniwal", device: "Lenovo ThinkPad", issue: "Keyboard not working", status: "Ready for Pickup", priority: "Low", amount: 1200, date: "02 Nov 2026" },
  { id: "JOB-1021", customer: "Arjun Jangra", device: "Acer Aspire 7", issue: "Battery draining", status: "In Repair", priority: "Medium", amount: 2200, date: "02 Nov 2026" },
  { id: "JOB-1020", customer: "Sonia Kumar", device: "MacBook Air M1", issue: "Software installation", status: "Received", priority: "Low", amount: 800, date: "01 Nov 2026" },
  { id: "JOB-1019", customer: "Sanjay Saini", device: "Asus VivoBook", issue: "Hinge repair", status: "Overdue", priority: "High", amount: 1600, date: "28 Oct 2026" },
];

export const inventory = [
  { id: 1, name: "Laptop SSD 256GB", sku: "SSD-256", category: "Storage", stock: 14, price: 1850, level: "In Stock" },
  { id: 2, name: "DDR4 RAM 8GB", sku: "RAM-8G", category: "Memory", stock: 3, price: 1450, level: "Low Stock" },
  { id: 3, name: "HP 65W Adapter", sku: "ADP-HP65", category: "Adapter", stock: 0, price: 950, level: "Out of Stock" },
  { id: 4, name: "Laptop Cooling Fan", sku: "FAN-01", category: "Cooling", stock: 8, price: 650, level: "In Stock" },
  { id: 5, name: "Laptop Keyboard", sku: "KEY-UNI", category: "Keyboard", stock: 2, price: 750, level: "Low Stock" },
];
