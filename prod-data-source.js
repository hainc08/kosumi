// Data source cho môi trường Hostinger (chạy migration từ bản build sẵn).
// Khác data-source.js gốc ở chỗ glob vào file .js đã compile trong dist/ thay vì src/*.ts.
// Dùng: npm run migration:run:prod   (cần có file .env với DATABASE_* như khi chạy app)
require('reflect-metadata');
const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['dist/modules/**/entities/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  timezone: '+00:00',
});

module.exports = AppDataSource;
module.exports.AppDataSource = AppDataSource;
