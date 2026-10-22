import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import config from '../config';
import logger from '../utils/logger';

export interface StoredUser {
  id: string;
  username: string;
  password: string; // bcrypt hash
}

/**
 * User store persisted as a JSON file so that password changes
 * survive restarts. The file is created on first start with a default
 * admin user whose password comes from ADMIN_PASSWORD.
 */
export class UserStore {
  private users = new Map<string, StoredUser>();

  constructor(
    private readonly filePath: string,
    adminPassword: string = config.auth.adminPassword
  ) {
    if (fs.existsSync(filePath)) {
      const stored: StoredUser[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      stored.forEach((user) => this.users.set(user.username, user));
    } else {
      this.users.set('admin', {
        id: '1',
        username: 'admin',
        password: bcrypt.hashSync(adminPassword, 10),
      });
      this.save();
      logger.info(`Created users file at ${filePath} with default admin user`);
    }
  }

  get(username: string): StoredUser | undefined {
    return this.users.get(username);
  }

  has(username: string): boolean {
    return this.users.has(username);
  }

  get size(): number {
    return this.users.size;
  }

  async verifyPassword(username: string, password: string): Promise<boolean> {
    const user = this.users.get(username);
    return user ? bcrypt.compare(password, user.password) : false;
  }

  async create(username: string, password: string): Promise<StoredUser> {
    const user: StoredUser = {
      id: (this.users.size + 1).toString(),
      username,
      password: await bcrypt.hash(password, 10),
    };
    this.users.set(username, user);
    this.save();
    return user;
  }

  async setPassword(username: string, password: string): Promise<void> {
    const user = this.users.get(username);
    if (!user) {
      throw new Error(`User not found: ${username}`);
    }
    user.password = await bcrypt.hash(password, 10);
    this.save();
  }

  private save(): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmpPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify([...this.users.values()], null, 2), { mode: 0o600 });
    fs.renameSync(tmpPath, this.filePath);
  }
}

export default new UserStore(config.auth.usersFile);
