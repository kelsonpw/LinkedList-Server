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

describe('POST /users', async () => {
  test('Creates a new user', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        username: 'whiskey',
        first_name: 'Whiskey',
        password: 'foo123',
        last_name: 'Lane',
        email: 'whiskey@rithmschool.com'
      });
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('username');
    expect(response.body).not.toHaveProperty('password');
  });
  test('Prevents creating a user with duplicate username', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        username: 'test',
        first_name: 'Test',
        password: 'foo123',
        last_name: 'McTester',
        email: 'test@rithmschool.com'
      });
    expect(response.statusCode).toBe(409);
  });
  test('Prevents creating a user without required password field', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        username: 'test',
        first_name: 'Test',
        last_name: 'McTester',
        email: 'test@rithmschool.com'
      });
    expect(response.statusCode).toBe(400);
  });
});
describe('GET /users', async () => {
  test('Gets a list of 1 user', async () => {
    const response = await request(app)
      .get('/users')
      .set('authorization', `Bearer ${auth.user_token}`);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('username');
    expect(response.body[0]).not.toHaveProperty('password');
  });
  test('Gets a list of 0 users with offset and limit', async () => {
    const response = await request(app)
      .get('/users?offset=1&limit=99')
      .set('authorization', `Bearer ${auth.user_token}`);
    expect(response.body).toHaveLength(0);
  });
  test('Responds with a 400 for invalid offset', async () => {
    const response = await request(app)
      .get('/users?offset=foo&limit=99')
      .set('authorization', `Bearer ${auth.user_token}`);
    expect(response.statusCode).toBe(400);
  });
  test('Responds with a 400 for invalid limit', async () => {
    const response = await request(app)
      .get('/users?offset=1&limit=-1')
      .set('authorization', `Bearer ${auth.user_token}`);
    expect(response.statusCode).toBe(400);
  });
});

describe('GET /users/:username', async () => {
  test('Gets a single a user', async () => {
    const response = await request(app)
      .get(`/users/${auth.current_username}`)
      .set('authorization', `Bearer ${auth.user_token}`);
    expect(response.body).toHaveProperty('username');
    expect(response.body).not.toHaveProperty('password');
    expect(response.body.username).toBe('test');
  });
  test('Responds with a 404 if it cannot find the user in question', async () => {
    const response = await request(app)
      .get(`/users/yaaasss`)
      .set('authorization', `Bearer ${auth.user_token}`);
    expect(response.statusCode).toBe(404);
  });
});

describe('PATCH /users/:username', async () => {
  test("Updates a single a user's first_name", async () => {
    const response = await request(app)
      .patch(`/users/${auth.current_username}`)
      .set('authorization', `Bearer ${auth.user_token}`)
      .send({ first_name: 'xkcd' });
    expect(response.body).toHaveProperty('username');
    expect(response.body).not.toHaveProperty('password');
    expect(response.body.first_name).toBe('xkcd');
    expect(response.body.username).not.toBe(null);
  });
  test("Updates a single a user's password", async () => {
    const response = await request(app)
      .patch(`/users/${auth.current_username}`)
      .set('authorization', `Bearer ${auth.user_token}`)
      .send({ password: 'foo12345' });
    expect(response.body).toHaveProperty('username');
    expect(response.body).not.toHaveProperty('password');
  });
  test('Prevents a bad user update', async () => {
    const response = await request(app)
      .patch(`/users/${auth.current_username}`)
      .set('authorization', `Bearer ${auth.user_token}`)
      .send({ cactus: false });
    expect(response.statusCode).toBe(400);
  });
  test('Forbids a user from editing another user', async () => {
    const response = await request(app)
      .patch(`/users/notme`)
      .set('authorization', `Bearer ${auth.user_token}`)
      .send({ password: 'foo12345' });
    expect(response.statusCode).toBe(403);
  });
  test('Responds with a 404 if it cannot find the user in question', async () => {
    // delete user first
    await request(app)
      .delete(`/users/${auth.current_username}`)
      .set('authorization', `Bearer ${auth.user_token}`);
    const response = await request(app)
      .patch(`/users/${auth.current_username}`)
      .set('authorization', `Bearer ${auth.user_token}`)
      .send({ password: 'foo12345' });
    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /users/:username', async () => {
  test('Deletes a single a user', async () => {
    const response = await request(app)
      .delete(`/users/${auth.current_username}`)
      .set('authorization', `Bearer ${auth.user_token}`);
    expect(response.body).toHaveProperty('username');
    expect(response.body).not.toHaveProperty('password');
  });
  test('Forbids a user from deleting another user', async () => {
    const response = await request(app)
      .delete(`/users/notme`)
      .set('authorization', `Bearer ${auth.user_token}`);
    expect(response.statusCode).toBe(403);
  });
  test('Responds with a 404 if it cannot find the user in question', async () => {
    // delete user first
    await request(app)
      .delete(`/users/${auth.current_username}`)
      .set('authorization', `Bearer ${auth.user_token}`);
    const response = await request(app)
      .delete(`/users/${auth.current_username}`)
      .set('authorization', `Bearer ${auth.user_token}`);
    expect(response.statusCode).toBe(404);
  });
});

afterEach(async () => {
  await afterEachHook();
});

afterAll(async () => {
  await afterAllHook();
});