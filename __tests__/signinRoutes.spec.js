const request = require('supertest');

const { decodeToken } = require('../api/helpers/authHelpers');
const { getUsers } = require('../api/helpers/guideHelpers');
const { guideSeed } = require('../data/seeds/01_users.js');
const server = require('../api/server');
const db = require('../data/dbConfig');

afterEach(async () => {
	const guides = await db('guides');
	if (guides.length > 10) {
		await db('guides').truncate();
		await db('guides').insert(guideSeed);
	}
});

describe('Sign In Route Tests (/auth routes)', () => {
	describe('POST /register route', () => {
		const user = { username: 'testy', password: '1', name: 'TestMe' };
		it('should respond with object & status code 201', async () => {
			let response = await request(server)
				.post('/auth/register')
				.send(user);

			expect(response.status).toBe(201);
			expect(response.type).toMatch(/json/i);
		});
		it('should send 500 error if missing object keys', async () => {
			let fail = { username: 'holden' };
			let response = await request(server)
				.post('/api/register')
				.send(fail);

			expect(response.status).toBe(404);

			fail = { username: 'Bob', password: 'bob' };
			response = await request(server)
				.post('/api/register')
				.send(fail);

			expect(response.status).toBe(404);
		});

		it('should send back object with token and user', async () => {
			const guides = await getUsers();
			const lastId = guides[guides.length - 1].id;

			const response = await request(server)
				.post('/auth/register')
				.send(user);
			const decoded = await decodeToken(response.body.token);

			expect(response.body).toBeTruthy();
			expect(response.body.id).toEqual(lastId + 1);
			expect(decoded.guide.username).toEqual(user.username);
		});
	});

	describe('POST /auth/login route', () => {
		const guide = {
			password: '850RKI7uKgC',
			username: 'sjoskowitz0',
			name: 'Stephannie Joskowitz'
		};

		it('should respond with status code 200', async () => {
			const response = await request(server)
				.post('/auth/login')
				.send(guide);

			expect(response.status).toEqual(200);
		});
		it('should respond with a json', async () => {
			const response = await request(server)
				.post('/auth/login')
				.send(guide);

			expect(response.type).toMatch(/json/i);
		});
		it('should respond with token and user', async () => {
			const response = await request(server)
				.post('/auth/login')
				.send(guide);
			const { token, id } = response.body;

			expect(token).toBeTruthy();
			expect(id).toBe(1);
		});
		it('should send 404 for incorrect username', async () => {
			const fail = { password: '850RKI7uKgC', username: 'sjoskowitz1' };
			const response = await request(server)
				.post('/auth/login')
				.send(fail);

			expect(response.status).toBe(404);
		});
		it('should send 404 for missing password/incorrect username', async () => {
			let fail1 = { username: 'jeff', name: 'womp' };
			let response = await request(server)
				.post('/auth/login')
				.send(fail1);

			expect(response.status).toBe(404);

			fail1 = { ...fail1, username: 'sjoskowitz1' };
			response = await request(server)
				.post('/auth/login')
				.send(fail1);

			expect(response.status).toBe(404);
		});
		it('should send 500 for missing username', async () => {
			let fail = { password: '850RKI7uKgC', name: 'sjoskowitz1' };
			response = await request(server)
				.post('/auth/login')
				.send(fail);

			expect(response.status).toBe(500);
		});
	});
});
