// npm packages
const request = require('supertest');

// app imports
const app = require('../../app/app');

const {
  auth,
  afterEachHook,
  afterAllHook,
  beforeAllHook,
  beforeEachHook
} = require('./config');

beforeAll(async () => {
  await beforeAllHook();
});

beforeEach(async () => {
  await beforeEachHook(auth);
});

describe('GET /jobs', async () => {
  test('Gets a list of 1 job successfully', async () => {
    const response = await request(app)
      .get('/jobs')
      .set('authorization', `Bearer ${auth.user_token}`);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('id');
  });
});

afterEach(async () => {
  await afterEachHook();
});

afterAll(async () => {
  await afterAllHook();
});