const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.USE_IN_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test-suite-jwt-secret-key';

const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const { seedDemoData } = require('../utils/seedData');

let citizenToken = '';
let adminToken = '';
let createdBudgetId = '';
let createdDeptId = '';
let createdProposalId = '';
let createdProjectId = '';

describe('Transparent Local Governance & Budgeting API Suite', () => {
  before(async () => {
    await connectDB();
    await seedDemoData({ force: true });
  });

  after(async () => {
    await disconnectDB();
  });

  it('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.status, 'healthy');
  });

  it('POST /api/auth/register registers a new citizen in MongoDB', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Citizen User',
      email: 'newcitizen@example.org',
      password: 'Password123!',
      ward: 'Ward 5 - Westview',
      phone: '+1-555-9999',
      role: 'admin', // Attempt privilege escalation — must be ignored!
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'citizen');
    assert.equal(res.body.user.email, 'newcitizen@example.org');
    citizenToken = res.body.token;
  });

  it('POST /api/auth/login logs in registered citizen and demo admin', async () => {
    const citizenLogin = await request(app).post('/api/auth/login').send({
      email: 'newcitizen@example.org',
      password: 'Password123!',
    });
    assert.equal(citizenLogin.status, 200);
    assert.ok(citizenLogin.body.token);

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@civicledger.demo',
      password: 'AdminPassword123!',
    });
    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.body.user.role, 'admin');
    adminToken = adminLogin.body.token;
  });

  it('Protects admin endpoints from citizen role (403) and unauthenticated users (401)', async () => {
    const unauth = await request(app).post('/api/budgets').send({
      fiscalYear: 2027,
      title: 'Unauthorized Budget',
      totalAmount: 100000,
    });
    assert.equal(unauth.status, 401);

    const forbidden = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        fiscalYear: 2027,
        title: 'Citizen Attempted Budget',
        totalAmount: 100000,
      });
    assert.equal(forbidden.status, 403);
  });

  it('Admin can create department, create draft budget, allocate funds, and publish to public dashboard', async () => {
    const deptRes = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Smart Clean Energy',
        code: 'ENG',
        headOfDepartment: 'Eng. Ada Lovelace',
        color: '#0f766e',
      });
    assert.equal(deptRes.status, 201);
    createdDeptId = deptRes.body.department._id;

    const budgetRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fiscalYear: 2027,
        title: 'FY 2027 Test Municipal Budget',
        totalAmount: 5000000,
        status: 'draft',
      });
    assert.equal(budgetRes.status, 201);
    createdBudgetId = budgetRes.body.budget._id;

    // Draft budget must NOT appear on public list
    const publicListBefore = await request(app).get('/api/budgets');
    assert.equal(
      publicListBefore.body.budgets.some((b) => b._id === createdBudgetId),
      false
    );

    // Allocate funds
    const allocRes = await request(app)
      .put(`/api/budgets/${createdBudgetId}/allocate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        departmentId: createdDeptId,
        allocatedAmount: 1500000,
        notes: 'Solar microgrid phase 1',
      });
    assert.equal(allocRes.status, 200);

    // Publish budget
    const pubRes = await request(app)
      .put(`/api/budgets/${createdBudgetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'published' });
    assert.equal(pubRes.status, 200);
    assert.equal(pubRes.body.budget.status, 'published');

    // Now visible on public dashboard
    const dashRes = await request(app).get(`/api/budgets/dashboard?budgetId=${createdBudgetId}`);
    assert.equal(dashRes.status, 200);
    assert.equal(dashRes.body.summary.totalAllocatedBudget, 5000000);
    assert.equal(dashRes.body.departmentBreakdown[0].departmentName, 'Smart Clean Energy');
  });

  it('Citizen proposal submission -> Admin approval -> Citizen voting & duplicate vote prevention', async () => {
    const propRes = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Community Solar Microgrid for Ward 5 Clinic',
        description:
          'Install battery-backed solar panels for the Ward 5 primary health clinic to prevent outages during storms.',
        category: 'Healthcare',
        location: 'Ward 5 - Westview Clinic',
        estimatedBudget: 95000,
      });
    assert.equal(propRes.status, 201);
    createdProposalId = propRes.body.proposal._id;
    assert.equal(propRes.body.proposal.status, 'Pending');

    // Voting before approval should fail
    const earlyVote = await request(app)
      .post(`/api/votes/${createdProposalId}`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({});
    assert.equal(earlyVote.status, 400);

    // Admin approves proposal
    const approveRes = await request(app)
      .patch(`/api/proposals/${createdProposalId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Approved',
        adminRemarks: 'Approved for Ward 5 citizen vote.',
      });
    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.proposal.status, 'Approved');

    // Appears on ballot
    const ballotRes = await request(app).get('/api/votes/ballot');
    assert.equal(ballotRes.status, 200);
    assert.ok(ballotRes.body.proposals.some((p) => p._id === createdProposalId));

    // Citizen casts first vote -> succeeds
    const vote1 = await request(app)
      .post(`/api/votes/${createdProposalId}`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ comment: 'Great resilience project' });
    assert.equal(vote1.status, 201);
    assert.equal(vote1.body.voteCount, 1);

    // Citizen attempts duplicate vote -> 409 Conflict
    const vote2 = await request(app)
      .post(`/api/votes/${createdProposalId}`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({});
    assert.equal(vote2.status, 409);
  });

  it('Project creation, progress updates, expenditure recording & dashboard recalculation', async () => {
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Ward 5 Solar Microgrid Installation',
        departmentId: createdDeptId,
        budgetId: createdBudgetId,
        location: 'Ward 5 - Westview',
        allocatedBudget: 400000,
        startDate: '2027-01-10',
        expectedCompletionDate: '2027-06-30',
        status: 'In Progress',
        completionPercentage: 25,
      });
    assert.equal(projRes.status, 201);
    createdProjectId = projRes.body.project._id;

    // Record expenditure linked to project
    const expRes = await request(app)
      .post('/api/expenditures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        budgetId: createdBudgetId,
        departmentId: createdDeptId,
        projectId: createdProjectId,
        title: 'Solar Inverter & Battery Bank Batch 1',
        description: 'Procurement of lithium-iron-phosphate storage bank.',
        amount: 125000,
        vendorName: 'CleanGrid Solutions',
      });
    assert.equal(expRes.status, 201);

    // Update project progress
    const progRes = await request(app)
      .patch(`/api/projects/${createdProjectId}/progress`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        completionPercentage: 60,
        status: 'In Progress',
        note: 'Roof mounting and inverter wiring completed.',
      });
    assert.equal(progRes.status, 200);
    assert.equal(progRes.body.project.completionPercentage, 60);
    assert.equal(progRes.body.project.amountSpent, 125000);

    // Verify dashboard reflects new expenditure immediately
    const dashRes = await request(app).get(`/api/budgets/dashboard?budgetId=${createdBudgetId}`);
    assert.equal(dashRes.status, 200);
    assert.equal(dashRes.body.summary.totalSpent, 125000);
    assert.equal(dashRes.body.summary.remainingBudget, 5000000 - 125000);
  });

  it('Public proposals endpoint never exposes private citizen email/phone', async () => {
    const res = await request(app).get('/api/proposals');
    assert.equal(res.status, 200);
    for (const p of res.body.proposals) {
      assert.equal(p.submittedBy?.email, undefined);
      assert.equal(p.submittedBy?.phone, undefined);
      assert.equal(p.submittedBy?.password, undefined);
    }
  });

  it('Reports summary and CSV export return valid downloadable data', async () => {
    const summaryRes = await request(app).get('/api/reports/summary?fiscalYear=2027');
    assert.equal(summaryRes.status, 200);
    assert.equal(summaryRes.body.budget.totalSpent, 125000);

    const csvRes = await request(app).get('/api/reports/export?type=spending&fiscalYear=2027');
    assert.equal(csvRes.status, 200);
    assert.match(csvRes.headers['content-type'], /text\/csv/);
    assert.match(csvRes.text, /Solar Inverter & Battery Bank Batch 1/);
  });

  it('Feedback submission and admin response workflow works', async () => {
    const fbRes = await request(app).post('/api/feedback').send({
      senderName: 'Public Visitor',
      senderEmail: 'visitor@example.org',
      type: 'Inquiry',
      subject: 'When will Ward 5 microgrid go live?',
      message: 'Looking forward to clean backup power at the clinic.',
      projectId: createdProjectId,
    });
    assert.equal(fbRes.status, 201);
    const fbId = fbRes.body.feedback._id;

    const respRes = await request(app)
      .patch(`/api/feedback/${fbId}/respond`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'Resolved',
        adminResponse: 'Scheduled for commissioning on June 30, 2027.',
      });
    assert.equal(respRes.status, 200);
    assert.equal(respRes.body.feedback.status, 'Resolved');
  });
});
