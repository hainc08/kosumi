import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const rootDir = process.cwd();
const deployTemp = path.join(rootDir, '../deploy_temp');

try {
  console.log('1. Checkout nhánh demo...');
  // Nếu nhánh demo đã có thì xoá đi tạo lại
  try { execSync('git branch -D demo', { stdio: 'ignore' }); } catch (e) {}
  execSync('git checkout -b demo', { stdio: 'inherit' });

  console.log('2. Chuẩn bị thư mục tạm...');
  if (fs.existsSync(deployTemp)) {
    fs.rmSync(deployTemp, { recursive: true, force: true });
  }
  fs.mkdirSync(deployTemp);

  console.log('3. Copy file build ra thư mục tạm...');
  fs.copyFileSync(path.join(rootDir, 'backend/package.json'), path.join(deployTemp, 'package.json'));
  if (fs.existsSync(path.join(rootDir, 'backend/package-lock.json'))) {
    fs.copyFileSync(path.join(rootDir, 'backend/package-lock.json'), path.join(deployTemp, 'package-lock.json'));
  }
  
  fs.cpSync(path.join(rootDir, 'backend/dist'), path.join(deployTemp, 'dist'), { recursive: true });
  fs.cpSync(path.join(rootDir, 'frontend/dist'), path.join(deployTemp, 'client'), { recursive: true });

  console.log('4. Xoá mã nguồn gốc trong nhánh demo...');
  // Remove all tracked files
  execSync('git rm -rf .', { stdio: 'inherit' });

  console.log('5. Copy lại file deploy vào root...');
  fs.cpSync(deployTemp, rootDir, { recursive: true });
  
  fs.writeFileSync(path.join(rootDir, '.gitignore'), "node_modules/\n.env\n");

  console.log('6. Commit nhánh demo...');
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "🚀 Bản build sẵn dành cho Hostinger (chỉ có dist, client và package.json)"', { stdio: 'inherit' });

  console.log('7. Dọn dẹp...');
  fs.rmSync(deployTemp, { recursive: true, force: true });

  console.log('HOÀN TẤT! Đang ở nhánh demo.');
} catch (error) {
  console.error('Lỗi:', error.message);
}
