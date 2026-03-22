const request = require('supertest');

const app = require('../server');

describe('API smoke tests', () => {
  it('GET /api/health returns healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
  });

  it('GET /api/translate/languages returns languages', async () => {
    const res = await request(app).get('/api/translate/languages?service=google');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('languages');
    expect(typeof res.body.languages).toBe('object');
    expect(Object.keys(res.body.languages).length).toBeGreaterThan(0);
  });
});

