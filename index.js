const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: 'ok', message: 'Calendar Reminder API is running' });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

// 导入backend路由
const reminderRoutes = require('./backend/src/routes/reminder');
const userRoutes = require('./backend/src/routes/user');

// 使用backend路由
app.use('/api/reminders', reminderRoutes);
app.use('/api/users', userRoutes);

// 导入定时服务
const cronService = require('./backend/src/services/cronService');

const port = process.env.PORT || 80;

/**
 * 初始化数据库连接和模型
 */
async function initDatabase() {
  // 检查是否使用SQLite（本地开发）
  const DB_TYPE = process.env.DB_TYPE || 'mysql';
  
  let sequelize;

  if (DB_TYPE === 'sqlite') {
    // 使用SQLite进行本地开发
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, 'database.sqlite'),
      logging: false
    });
    console.log('Using SQLite for local development');
  } else {
    // 使用MySQL（生产环境）
    const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;

    if (!MYSQL_USERNAME || !MYSQL_ADDRESS) {
      throw new Error('MySQL environment variables are not configured properly');
    }

    const [host, port] = MYSQL_ADDRESS.split(":");

    // 创建Sequelize实例
    sequelize = new Sequelize("nodejs_demo", MYSQL_USERNAME, MYSQL_PASSWORD, {
      host,
      port: port || 3306,
      dialect: "mysql",
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    console.log('Using MySQL for production');
  }

  // 导入模型定义函数
  const defineUserModel = require('./backend/src/models/User');
  const defineReminderModel = require('./backend/src/models/Reminder');

  // 定义模型
  const User = defineUserModel(sequelize);
  const Reminder = defineReminderModel(sequelize);

  // 同步数据库模型

  // 同步模型 - 使用安全的同步策略
  await sequelize.sync({ force: true });
  console.log('Database synchronized successfully');

  // 将sequelize实例存储到全局和app.locals
  global.sequelize = sequelize;
  app.locals.sequelize = sequelize;

  return sequelize;
}

async function bootstrap() {
  try {
    // 初始化数据库
    await initDatabase();
    console.log('Connected to MySQL');

    // 启动定时任务
    cronService.start();

    app.listen(port, () => {
      console.log("启动成功", port);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
