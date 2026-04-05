const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes  = require('./routes/auth');
const ideaRoutes  = require('./routes/ideas');
const userRoutes  = require('./routes/users');
const attachSocket = require('./socket');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: ['http://localhost:3000','http://127.0.0.1:3000'], methods:['GET','POST'] }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth',  authRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/users', userRoutes);
app.get('/health', (_,res) => res.json({ ok:true }));

attachSocket(io);

// Connect DB + seed admin
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/metaversity';
mongoose.connect(MONGO)
  .then(async () => {
    console.log('[DB] MongoDB connected');
    await seedAdmin();
  })
  .catch(err => {
    console.warn('[DB] MongoDB not connected:', err.message);
    console.warn('[DB] Running without database — auth/ideas will not work');
    console.warn('[DB] Start MongoDB or set MONGO_URI env var');
  });

async function seedAdmin() {
  try {
    const { User } = require('./models');
    const bcrypt   = require('bcryptjs');
    const exists   = await User.findOne({ role:'admin' });
    if (!exists) {
      const hash = await bcrypt.hash('Admin@123', 10);
      await User.create({
        name:'Platform Admin', email:'admin@metaversity.io',
        password:hash, role:'admin', avatar:'👑', avatarColor:'#f9ae61',
      });
      console.log('[Seed] Admin created → admin@metaversity.io / Admin@123');
    }
  } catch(e) {}
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🌐 Metaversity Server  →  http://localhost:${PORT}`);
  console.log('   Default admin: admin@metaversity.io / Admin@123\n');
});
