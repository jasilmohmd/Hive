// Disposable local API: never load the developer's server/.env or Atlas URI.
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('node:path');
const serverRoot = path.resolve(__dirname, '../server');
require(path.join(serverRoot, 'node_modules/ts-node')).register({ project: path.join(serverRoot, 'tsconfig.json'), transpileOnly: true });
const mongoose = require(path.join(serverRoot, 'node_modules/mongoose'));
const bcrypt = require(path.join(serverRoot, 'node_modules/bcrypt'));

async function start() {
  const mongo = await MongoMemoryServer.create({ binary: { version: '8.2.6' } });
  Object.assign(process.env, {
    NODE_ENV: 'test', MONGO_URI: mongo.getUri(), JWT_SECRET_KEY: 'hive-local-e2e-only-signing-key',
    CORS_ORIGIN: 'http://localhost:4200', CORS_ORIGIN_SUFFIXES: '', COOKIE_SAME_SITE: 'lax',
    CLOUDINARY_CLOUD_NAME: 'fixture', CLOUDINARY_API_KEY: 'fixture', CLOUDINARY_API_SECRET: 'fixture',
    LIVEKIT_URL: '', LIVEKIT_API_KEY: '', LIVEKIT_API_SECRET: '', EMAIL_USER: '', EMAIL_PASS: '',
  });
  await mongoose.connect(mongo.getUri(), { dbName: 'Hive_E2E' });
  const Users = require(path.join(serverRoot, 'src/framework/models/user.model')).default;
  const { CommunityModel } = require(path.join(serverRoot, 'src/framework/models/community.model'));
  const { RoleModel } = require(path.join(serverRoot, 'src/framework/models/role.model'));
  const { ChannelModel } = require(path.join(serverRoot, 'src/framework/models/channel.model'));
  const password = await bcrypt.hash('E2ePassword123!', 10);
  const [maker, friend] = await Users.create([
    { _id: '000000000000000000000001', userName: 'Test Maker', email: 'maker@example.test', password, friends: ['000000000000000000000002'] },
    { _id: '000000000000000000000002', userName: 'Other Maker', email: 'other@example.test', password, friends: ['000000000000000000000001'] },
    { _id: '000000000000000000000003', userName: 'New Maker', email: 'new@example.test', password },
  ]);
  const role = await RoleModel.create({ _id: '000000000000000000000020', communityId: '000000000000000000000010', name: 'Owner', permissions: ['MANAGE_COMMUNITY', 'MANAGE_MEMBERS', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_TAG', 'VIEW_CONTENT', 'SEND_MESSAGES'] });
  await CommunityModel.create({
    _id: '000000000000000000000010', name: 'Maker Community', description: 'Live isolated community', type: 'public',
    ownerId: maker._id, imageUrl: '/assets/images/Logo-bg-white.png', coverImageUrl: '/assets/images/Logo-bg-white.png',
    roles: [role._id], members: [{ userId: maker._id, roleIds: [role._id] }, { userId: friend._id, roleIds: [role._id] }],
    channels: ['000000000000000000000030', '000000000000000000000031'],
  });
  await ChannelModel.create([
    { _id: '000000000000000000000030', name: 'General', communityId: '000000000000000000000010', createdBy: maker._id, type: 'chatroom', allowedRoles: [role._id] },
    { _id: '000000000000000000000031', name: 'Voice Lounge', communityId: '000000000000000000000010', createdBy: maker._id, type: 'voiceroom', allowedRoles: [role._id], maxParticipants: 6 },
  ]);
  const { httpServer, io } = require(path.join(serverRoot, 'src/framework/config/app'));
  const cleanup = async () => { io.close(); httpServer.close(); await mongoose.disconnect(); await mongo.stop(); process.exit(0); };
  process.once('SIGINT', cleanup);
  process.once('SIGTERM', cleanup);
  httpServer.once('error', async error => { console.error(error); await cleanup(); });
  httpServer.listen(3000, 'localhost', () => console.log('Isolated Hive E2E API ready on localhost:3000'));
}
start().catch(error => { console.error(error); process.exit(1); });
