import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as crypto from 'crypto';

const JWT_SECRET = 'HACKAI';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    const connStr = process.env.DATABASE_URL || '';
    const pool = new Pool({
      connectionString: connStr,
      ssl: connStr.includes('sslmode=') || connStr.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
    });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  private hashPassword(password: string): string {
    return crypto.createHmac('sha256', JWT_SECRET).update(password).digest('hex');
  }

  private signJwt(payload: object): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const base64UrlEncode = (str: string) => Buffer.from(str).toString('base64url');
    
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
    
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
      
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  public verifyJwt(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, payload, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      return decodedPayload;
    } catch {
      return null;
    }
  }

  async register(data: { email: string; password: string; username?: string }) {
    const { email, password, username } = data;
    if (!email || !password) {
      throw new BadRequestException('Email và mật khẩu là bắt buộc.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email này đã được sử dụng.');
    }

    const passwordHash = this.hashPassword(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        username: username || email.split('@')[0],
        password_hash: passwordHash,
      },
    });

    const token = this.signJwt({ id: user.id, email: user.email, username: user.username });
    return {
      message: 'Đăng ký thành công.',
      access_token: token,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  async login(data: { email: string; password: string }) {
    const { email, password } = data;
    if (!email || !password) {
      throw new BadRequestException('Email và mật khẩu là bắt buộc.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    const passwordHash = this.hashPassword(password);
    if (user.password_hash !== passwordHash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    const token = this.signJwt({ id: user.id, email: user.email, username: user.username });
    return {
      message: 'Đăng nhập thành công.',
      access_token: token,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }
}
