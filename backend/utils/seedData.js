const User = require('../models/User');
const Department = require('../models/Department');
const Budget = require('../models/Budget');
const Expenditure = require('../models/Expenditure');
const Proposal = require('../models/Proposal');
const Vote = require('../models/Vote');
const Project = require('../models/Project');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');

/**
 * Seeds clearly marked Sample / Demo Municipal Data when the database is empty
 * (or when force=true). Never presents invented financials as real government data.
 */
async function seedDemoData({ force = false } = {}) {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0 && !force) {
    return { seeded: false, message: 'Database already populated' };
  }

  if (force) {
    await Promise.all([
      Notification.deleteMany({}),
      Feedback.deleteMany({}),
      Vote.deleteMany({}),
      Expenditure.deleteMany({}),
      Project.deleteMany({}),
      Proposal.deleteMany({}),
      Budget.deleteMany({}),
      Department.deleteMany({}),
      User.deleteMany({}),
    ]);
  }

  // 1. Create Demo Admin & Citizens
  const admin = await User.create({
    name: 'Dr. Elena Vance (Demo Admin)',
    email: 'admin@civicledger.demo',
    password: 'AdminPassword123!',
    role: 'admin',
    phone: '+1-555-0100',
    ward: 'Municipal Civic Center',
    address: '100 City Hall Plaza (Sample Demo)',
  });

  const citizen1 = await User.create({
    name: 'Marcus Sterling',
    email: 'citizen@civicledger.demo',
    password: 'CitizenPassword123!',
    role: 'citizen',
    phone: '+1-555-0142',
    ward: 'Ward 2 - Oakridge',
    address: '245 Oakridge Avenue (Sample Demo)',
  });

  const citizen2 = await User.create({
    name: 'Priya Nair',
    email: 'priya@civicledger.demo',
    password: 'CitizenPassword123!',
    role: 'citizen',
    phone: '+1-555-0188',
    ward: 'Ward 4 - Riverside',
    address: '82 Riverside Terrace (Sample Demo)',
  });

  const citizen3 = await User.create({
    name: 'David Morales',
    email: 'david@civicledger.demo',
    password: 'CitizenPassword123!',
    role: 'citizen',
    phone: '+1-555-0193',
    ward: 'Ward 1 - Central',
    address: '19 Market Street (Sample Demo)',
  });

  // 2. Create Departments
  const departments = await Department.insertMany([
    {
      name: 'Roads & Public Transport',
      code: 'RPT',
      description: 'Road resurfacing, smart traffic signals, pedestrian crossings, and municipal transit.',
      headOfDepartment: 'Eng. Samuel Brooks',
      contactEmail: 'roads@civicledger.demo',
      color: '#0f2d5e',
    },
    {
      name: 'Public Education & Libraries',
      code: 'EDU',
      description: 'Municipal schools, STEM labs, community libraries, and adult literacy centers.',
      headOfDepartment: 'Prof. Claire Lin',
      contactEmail: 'education@civicledger.demo',
      color: '#1d4ed8',
    },
    {
      name: 'Community Healthcare',
      code: 'HLT',
      description: 'Primary neighborhood clinics, maternal care, mobile diagnostics, and immunization drives.',
      headOfDepartment: 'Dr. Amir Patel',
      contactEmail: 'health@civicledger.demo',
      color: '#059669',
    },
    {
      name: 'Drinking Water & Supply',
      code: 'WTR',
      description: 'Clean water treatment plants, pipeline modernization, and ward water quality sensors.',
      headOfDepartment: 'Eng. Hannah Okafor',
      contactEmail: 'water@civicledger.demo',
      color: '#0284c7',
    },
    {
      name: 'Sanitation & Waste Management',
      code: 'SAN',
      description: 'Zero-waste recycling hubs, storm drainage, and solar street sanitation fleets.',
      headOfDepartment: 'Carlos Rivera',
      contactEmail: 'sanitation@civicledger.demo',
      color: '#0d9488',
    },
    {
      name: 'Parks & Civic Facilities',
      code: 'PRK',
      description: 'Urban greenways, neighborhood playgrounds, community halls, and LED park lighting.',
      headOfDepartment: 'Maya Thompson',
      contactEmail: 'parks@civicledger.demo',
      color: '#16a34a',
    },
  ]);

  const [deptRoads, deptEdu, deptHealth, deptWater, deptSanitation, deptParks] = departments;

  // 3. Create Annual Budgets (Published FY 2026 + Historical FY 2025)
  const votingDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const budget2026 = await Budget.create({
    fiscalYear: 2026,
    title: 'FY 2026 CivicLedger Sample Municipal Budget',
    description:
      'Sample demonstration annual municipal budget allocating funds across six core public service departments and participatory citizen initiatives.',
    totalAmount: 12000000,
    status: 'published',
    isDemoData: true,
    publishedAt: new Date('2026-01-05T09:00:00Z'),
    votingDeadline,
    createdBy: admin._id,
    allocations: [
      { department: deptRoads._id, allocatedAmount: 3200000, notes: 'Arterial road & bike-lane upgrade' },
      { department: deptEdu._id, allocatedAmount: 2400000, notes: 'School STEM & library modernization' },
      { department: deptHealth._id, allocatedAmount: 2200000, notes: 'Neighborhood clinic expansion' },
      { department: deptWater._id, allocatedAmount: 1800000, notes: 'Mainline filtration & smart meters' },
      { department: deptSanitation._id, allocatedAmount: 1300000, notes: 'Stormwater drainage & recycling' },
      { department: deptParks._id, allocatedAmount: 1100000, notes: 'Community parks & solar lighting' },
    ],
  });

  await Budget.create({
    fiscalYear: 2025,
    title: 'FY 2025 CivicLedger Sample Municipal Budget (Closed)',
    description: 'Prior-year sample budget archive for year-over-year comparative transparency analytics.',
    totalAmount: 10500000,
    status: 'published',
    isDemoData: true,
    publishedAt: new Date('2025-01-10T09:00:00Z'),
    createdBy: admin._id,
    allocations: [
      { department: deptRoads._id, allocatedAmount: 2900000, notes: 'Baseline road maintenance' },
      { department: deptEdu._id, allocatedAmount: 2100000, notes: 'Classroom upgrades' },
      { department: deptHealth._id, allocatedAmount: 1900000, notes: 'Clinic staffing & supplies' },
      { department: deptWater._id, allocatedAmount: 1500000, notes: 'Reservoir upkeep' },
      { department: deptSanitation._id, allocatedAmount: 1150000, notes: 'Collection fleet' },
      { department: deptParks._id, allocatedAmount: 950000, notes: 'Public green spaces' },
    ],
  });

  // 4. Create Citizen Proposals across statuses
  const proposals = await Proposal.insertMany([
    {
      title: 'Solar-Powered LED Streetlights Along Ward 2 School Corridor',
      description:
        'Install 65 high-efficiency solar LED streetlights with motion dimming along Oakridge School Corridor to improve pedestrian safety for students and evening commuters while cutting grid electricity costs.',
      category: 'Parks and public facilities',
      location: 'Ward 2 - Oakridge School Corridor',
      estimatedBudget: 185000,
      submittedBy: citizen1._id,
      status: 'Approved',
      adminRemarks: 'Technical feasibility verified by Public Works & Parks. Open for citizen voting.',
      reviewedBy: admin._id,
      reviewedAt: new Date('2026-02-12T10:00:00Z'),
      votingDeadline,
      voteCount: 2,
      attachments: [{ name: 'Corridor_Site_Map_Demo.pdf', url: 'https://example.org/demo/site-map.pdf', type: 'document' }],
    },
    {
      title: '24/7 Clean Drinking Water Kiosks at Central Bus Terminal & Market',
      description:
        'Construct four automated UV-filtered drinking water dispensing kiosks with real-time TDS water quality displays at high-footfall transit and market hubs.',
      category: 'Drinking water',
      location: 'Ward 1 - Central Market & Transit Hub',
      estimatedBudget: 140000,
      submittedBy: citizen3._id,
      status: 'Approved',
      adminRemarks: 'Water Dept confirmed pipeline pressure and approved for participatory vote.',
      reviewedBy: admin._id,
      reviewedAt: new Date('2026-02-14T11:30:00Z'),
      votingDeadline,
      voteCount: 2,
    },
    {
      title: 'Mobile Primary Healthcare & Diagnostics Van for Outer Wards',
      description:
        'Procure and equip a solar-assisted mobile clinic van providing weekly blood testing, maternal checkups, and preventive screenings in underserved outer neighborhoods.',
      category: 'Healthcare',
      location: 'Ward 4 & Ward 5 Outreach Zones',
      estimatedBudget: 260000,
      submittedBy: citizen2._id,
      status: 'Approved',
      adminRemarks: 'Endorsed by Community Health Directorate; ready for citizen ballot.',
      reviewedBy: admin._id,
      reviewedAt: new Date('2026-02-18T14:15:00Z'),
      votingDeadline,
      voteCount: 1,
    },
    {
      title: 'Protected Bike Lane & Smart Crosswalk on Riverside Boulevard',
      description:
        'Create a 3.2 km curb-separated bicycle lane with tactile paving and countdown pedestrian beacons connecting Riverside Park to Central Station.',
      category: 'Roads and transportation',
      location: 'Ward 4 - Riverside Boulevard',
      estimatedBudget: 310000,
      submittedBy: citizen2._id,
      status: 'Under Review',
      adminRemarks: 'Traffic engineering impact assessment currently underway.',
      reviewedBy: admin._id,
      reviewedAt: new Date('2026-03-02T09:00:00Z'),
    },
    {
      title: 'Neighborhood Public Library Digital Learning & Makerspace Lab',
      description:
        'Equip the Eastside Community Library annex with 25 workstations, 3D printers, and free coding workshops for high school students and job seekers.',
      category: 'Education',
      location: 'Ward 3 - Eastside Library Annex',
      estimatedBudget: 125000,
      submittedBy: citizen1._id,
      status: 'Pending',
    },
    {
      title: 'Smart Underground Composting Bins for Market Organic Waste',
      description:
        'Replace open dumpsters in the Farmers Market zone with sealed odor-free underground organic waste bins linked to municipal compost processing.',
      category: 'Sanitation',
      location: 'Ward 1 - Farmers Market Precinct',
      estimatedBudget: 95000,
      submittedBy: citizen3._id,
      status: 'Completed',
      adminRemarks: 'Approved in early cycle and delivered under Sanitation quick-win fund.',
      reviewedBy: admin._id,
      reviewedAt: new Date('2026-01-20T12:00:00Z'),
      voteCount: 3,
    },
  ]);

  // 5. Record Demo Votes (respecting unique {proposal, citizen} constraint)
  await Vote.insertMany([
    { proposal: proposals[0]._id, citizen: citizen1._id, fiscalYear: 2026, comment: 'Essential for student safety!' },
    { proposal: proposals[0]._id, citizen: citizen2._id, fiscalYear: 2026, comment: 'Great renewable initiative.' },
    { proposal: proposals[1]._id, citizen: citizen2._id, fiscalYear: 2026, comment: 'Clean water access helps everyone.' },
    { proposal: proposals[1]._id, citizen: citizen3._id, fiscalYear: 2026, comment: 'Much needed at the market.' },
    { proposal: proposals[2]._id, citizen: citizen3._id, fiscalYear: 2026, comment: 'Supports elderly residents in outer wards.' },
  ]);

  // 6. Create Ongoing & Completed Development Projects
  const projects = await Project.insertMany([
    {
      name: 'Central Arterial Resurfacing & Smart Signals Phase II',
      description: 'Low-noise asphalt resurfacing across 8.5 km of main roads with adaptive traffic signal controllers.',
      department: deptRoads._id,
      budget: budget2026._id,
      location: 'Central Corridor (Wards 1 & 2)',
      allocatedBudget: 1850000,
      amountSpent: 1240000,
      startDate: new Date('2026-01-15'),
      expectedCompletionDate: new Date('2026-09-30'),
      status: 'In Progress',
      completionPercentage: 68,
      contractor: 'Apex Civil Infrastructure Ltd. (Demo)',
      progressUpdates: [
        {
          note: 'Milling and base layer completed for 6.2 km; 14 smart signal poles installed.',
          percentage: 45,
          updatedBy: admin._id,
          updatedAt: new Date('2026-04-10'),
        },
        {
          note: 'Final asphalt paving finished on Main Ave; adaptive signal calibration underway.',
          percentage: 68,
          updatedBy: admin._id,
          updatedAt: new Date('2026-06-18'),
        },
      ],
    },
    {
      name: 'Municipal STEM Labs & Library Wi-Fi Modernization',
      description: 'Upgrading 6 public secondary school science labs and providing gigabit fiber access across neighborhood libraries.',
      department: deptEdu._id,
      budget: budget2026._id,
      location: 'Citywide (Wards 1 - 5)',
      allocatedBudget: 1100000,
      amountSpent: 820000,
      startDate: new Date('2026-02-01'),
      expectedCompletionDate: new Date('2026-08-20'),
      status: 'In Progress',
      completionPercentage: 75,
      contractor: 'EduTech Systems Group (Demo)',
      progressUpdates: [
        {
          note: 'Four of six school STEM labs outfitted with microscopes, robotics kits, and smartboards.',
          percentage: 75,
          updatedBy: admin._id,
          updatedAt: new Date('2026-06-05'),
        },
      ],
    },
    {
      name: 'Ward 4 Primary Health Clinic & Diagnostics Wing',
      description: 'Expansion of the Riverside community health center with an outpatient lab, pharmacy, and vaccination wing.',
      department: deptHealth._id,
      budget: budget2026._id,
      location: 'Ward 4 - Riverside',
      allocatedBudget: 1350000,
      amountSpent: 1310000,
      startDate: new Date('2025-11-01'),
      expectedCompletionDate: new Date('2026-05-30'),
      actualCompletionDate: new Date('2026-05-24'),
      status: 'Completed',
      completionPercentage: 100,
      contractor: 'MedBuild Civic Constructors (Demo)',
      progressUpdates: [
        {
          note: 'Diagnostic equipment commissioned and clinic opened to public.',
          percentage: 100,
          updatedBy: admin._id,
          updatedAt: new Date('2026-05-24'),
        },
      ],
    },
    {
      name: 'Northside Trunk Waterline Replacement & Leak Sensors',
      description: 'Replacing aging cast-iron water mains with ductile iron pipes and acoustic leak-detection telemetry.',
      department: deptWater._id,
      budget: budget2026._id,
      location: 'Ward 3 - Northside',
      allocatedBudget: 1200000,
      amountSpent: 540000,
      startDate: new Date('2026-03-10'),
      expectedCompletionDate: new Date('2026-11-15'),
      status: 'In Progress',
      completionPercentage: 42,
      contractor: 'HydroFlow Municipal Works (Demo)',
      progressUpdates: [
        {
          note: 'Phase 1 trenching and 2.1 km pipe installation pressure-tested.',
          percentage: 42,
          updatedBy: admin._id,
          updatedAt: new Date('2026-06-12'),
        },
      ],
    },
    {
      name: 'Farmers Market Underground Composting & Drainage Upgrade',
      description: 'Zero-odor underground organic waste chambers and permeable storm drainage pavers.',
      department: deptSanitation._id,
      budget: budget2026._id,
      proposal: proposals[5]._id,
      location: 'Ward 1 - Farmers Market Precinct',
      allocatedBudget: 480000,
      amountSpent: 465000,
      startDate: new Date('2026-01-25'),
      expectedCompletionDate: new Date('2026-04-30'),
      actualCompletionDate: new Date('2026-04-26'),
      status: 'Completed',
      completionPercentage: 100,
      contractor: 'GreenCycle Engineering (Demo)',
      progressUpdates: [
        {
          note: 'All 8 underground chambers operational and handed over to Sanitation Dept.',
          percentage: 100,
          updatedBy: admin._id,
          updatedAt: new Date('2026-04-26'),
        },
      ],
    },
    {
      name: 'Riverside Greenway & Inclusive Playground',
      description: 'Accessible playground equipment, shaded walking trail, and rainwater bioswales along the riverfront.',
      department: deptParks._id,
      budget: budget2026._id,
      location: 'Ward 4 - Riverside Park',
      allocatedBudget: 620000,
      amountSpent: 195000,
      startDate: new Date('2026-05-01'),
      expectedCompletionDate: new Date('2026-12-10'),
      status: 'In Progress',
      completionPercentage: 30,
      contractor: 'UrbanScape Studios (Demo)',
      progressUpdates: [
        {
          note: 'Site grading and accessible pathway foundations poured.',
          percentage: 30,
          updatedBy: admin._id,
          updatedAt: new Date('2026-06-20'),
        },
      ],
    },
  ]);

  // Link completed proposal to its project
  proposals[5].linkedProject = projects[4]._id;
  await proposals[5].save();

  // 7. Record Sample Expenditures
  await Expenditure.insertMany([
    {
      budget: budget2026._id,
      department: deptRoads._id,
      project: projects[0]._id,
      title: 'Asphalt Mix & Milling Milestone #1',
      description: 'Supply and laying of 4.5 km polymer-modified asphalt along Central Avenue.',
      amount: 760000,
      transactionDate: new Date('2026-02-22'),
      vendorName: 'Apex Civil Infrastructure Ltd.',
      referenceNumber: 'EXP-2026-001',
      recordedBy: admin._id,
    },
    {
      budget: budget2026._id,
      department: deptRoads._id,
      project: projects[0]._id,
      title: 'Adaptive Traffic Controller Hardware',
      description: 'Procurement and installation of 14 solar-backed intersection signal controllers.',
      amount: 480000,
      transactionDate: new Date('2026-04-14'),
      vendorName: 'SignalGrid Mobility Corp.',
      referenceNumber: 'EXP-2026-002',
      recordedBy: admin._id,
    },
    {
      budget: budget2026._id,
      department: deptEdu._id,
      project: projects[1]._id,
      title: 'STEM Lab Equipment & Interactive Displays',
      description: 'Laboratory benches, digital microscopes, and interactive displays for 4 secondary schools.',
      amount: 820000,
      transactionDate: new Date('2026-03-19'),
      vendorName: 'EduTech Systems Group',
      referenceNumber: 'EXP-2026-003',
      recordedBy: admin._id,
    },
    {
      budget: budget2026._id,
      department: deptHealth._id,
      project: projects[2]._id,
      title: 'Clinic Civil Works & Diagnostic Suite',
      description: 'Completion payment for outpatient clinic wing and hematology analyzers.',
      amount: 1310000,
      transactionDate: new Date('2026-05-18'),
      vendorName: 'MedBuild Civic Constructors',
      referenceNumber: 'EXP-2026-004',
      recordedBy: admin._id,
    },
    {
      budget: budget2026._id,
      department: deptWater._id,
      project: projects[3]._id,
      title: 'Ductile Iron Mains & Acoustic Sensors',
      description: 'Pipeline material batch 1 and 30 IoT acoustic leak detection nodes.',
      amount: 540000,
      transactionDate: new Date('2026-04-29'),
      vendorName: 'HydroFlow Municipal Works',
      referenceNumber: 'EXP-2026-005',
      recordedBy: admin._id,
    },
    {
      budget: budget2026._id,
      department: deptSanitation._id,
      project: projects[4]._id,
      title: 'Underground Waste Chambers & Pavers',
      description: 'Turnkey installation of 8 sealed composting units and storm pavers.',
      amount: 465000,
      transactionDate: new Date('2026-04-20'),
      vendorName: 'GreenCycle Engineering',
      referenceNumber: 'EXP-2026-006',
      recordedBy: admin._id,
    },
    {
      budget: budget2026._id,
      department: deptParks._id,
      project: projects[5]._id,
      title: 'Greenway Site Preparation & Grading',
      description: 'Earthworks, bioswale excavation, and accessible concrete base.',
      amount: 195000,
      transactionDate: new Date('2026-06-08'),
      vendorName: 'UrbanScape Studios',
      referenceNumber: 'EXP-2026-007',
      recordedBy: admin._id,
    },
    {
      budget: budget2026._id,
      department: deptSanitation._id,
      title: 'Quarterly Municipal Recycling Fleet Maintenance',
      description: 'Scheduled servicing and battery replacement for electric refuse vehicles.',
      amount: 145000,
      transactionDate: new Date('2026-06-15'),
      vendorName: 'Civic Fleet Services',
      referenceNumber: 'EXP-2026-008',
      recordedBy: admin._id,
    },
  ]);

  // 8. Sample Feedback
  await Feedback.insertMany([
    {
      user: citizen1._id,
      senderName: citizen1.name,
      senderEmail: citizen1.email,
      type: 'Suggestion',
      subject: 'Publish monthly contractor milestone photos on Project Tracker',
      message: 'Adding photo evidence alongside completion percentages would boost neighborhood trust even further.',
      department: deptRoads._id,
      project: projects[0]._id,
      status: 'Resolved',
      adminResponse: 'Thank you Marcus! Progress update logs now support detailed milestone notes and document links.',
      respondedBy: admin._id,
      respondedAt: new Date('2026-05-12'),
    },
    {
      user: citizen2._id,
      senderName: citizen2.name,
      senderEmail: citizen2.email,
      type: 'Complaint',
      subject: 'Nighttime construction noise near Riverside Blvd junction',
      message: 'Requesting crews to observe the 9:00 PM curfew near residential blocks during paving work.',
      department: deptRoads._id,
      status: 'In Review',
      adminResponse: 'Site inspector has been assigned to enforce acoustic curfew hours.',
      respondedBy: admin._id,
      respondedAt: new Date('2026-06-16'),
    },
  ]);

  // 9. Sample Notifications
  await Notification.insertMany([
    {
      recipient: citizen1._id,
      title: 'Proposal Approved for Citizen Voting',
      message: 'Your proposal "Solar-Powered LED Streetlights Along Ward 2 School Corridor" is now live on the Voting page!',
      type: 'proposal',
      link: '/voting',
    },
    {
      recipient: citizen1._id,
      title: 'Feedback Addressed',
      message: 'Municipality Administration responded to your suggestion regarding Project Tracker milestones.',
      type: 'feedback',
      link: '/feedback',
    },
    {
      recipient: admin._id,
      title: 'New Citizen Proposal Pending Review',
      message: 'A new Education proposal ("Neighborhood Public Library Digital Learning & Makerspace Lab") awaits your review.',
      type: 'proposal',
      link: '/admin',
    },
  ]);

  return {
    seeded: true,
    message: 'Sample municipal demo data created successfully',
    counts: {
      users: 4,
      departments: departments.length,
      budgets: 2,
      proposals: proposals.length,
      projects: projects.length,
    },
  };
}

module.exports = { seedDemoData };
