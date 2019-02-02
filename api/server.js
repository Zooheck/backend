require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');

const { getUserById, register, generateToken, login } = require('./helpers');
const protectedRouter = require('./routes/protectedRoutes');

const server = express();
server.use(express.json());
server.use(helmet());

server.post('/api/register', async (req, res) => {
	const userInfo = req.body;
	userInfo.password = bcrypt.hashSync(userInfo.password, 14);
	try {
		const ids = await register(userInfo);
		const user = await getUserById(ids[0]);
		const token = generateToken(user);
		res.status(201).json({ token, id: user.id });
	} catch (err) {
		// if (err.errno === 19) return res.status(400).json({ error: 'That username already exists' });
		console.log(err);
		res.status(500).json(err);
	}
});

server.post('/api/login', async (req, res) => {
	const creds = req.body;
	try {
		const user = await login(creds);
		if (user && bcrypt.hashSync(creds.password, user.password)) {
			const token = generateToken(user);
			res.status(200).json({ user, token });
		}
	} catch (err) {
		res.status(500).json(err);
	}
});

server.use('/guide', protectedRouter);

module.exports = server;
