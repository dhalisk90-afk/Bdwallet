import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { dbInstance, UserRecordDb } from './db.js';

const JWT_SECRET = process.env.SESSION_SECRET || 'bd_wallet_secure_key_Dhaka_2026_salt';

export interface AuthenticatedRequest extends Request {
  user?: UserRecordDb;
}

// Generate secure signed session token
export function createSessionToken(user: UserRecordDb): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

// Verify token
export function verifySessionToken(token: string): { sub: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (expectedSignature !== signature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

// Middleware: Require Authenticated User
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      messageBangla: 'অনুগ্রহ করে প্রথমে লগইন করুন। আপনার সেশন পাওয়া যায়নি।',
      error: 'Unauthorized',
    });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifySessionToken(token);
  if (!decoded) {
    res.status(401).json({
      success: false,
      messageBangla: 'আপনার সেশনের মেয়াদ শেষ হয়েছে। পুনরায় লগইন করুন।',
      error: 'Token invalid or expired',
    });
    return;
  }

  const user = dbInstance.getUserById(decoded.sub);
  if (!user) {
    res.status(401).json({
      success: false,
      messageBangla: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।',
      error: 'User not found',
    });
    return;
  }

  req.user = user;
  next();
}

// Middleware: Require Admin
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      messageBangla: 'অ্যাক্সেস সংরক্ষিত। শুধুমাত্র অ্যাডমিন এই তথ্য দেখতে বা পরিবর্তন করতে পারবেন।',
      error: 'Forbidden: Admin access required',
    });
    return;
  }
  next();
}

// Security & Field Validation
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  sanitizedData?: any;
}

export function validateRecordPayload(body: any): ValidationResult {
  const errors: Record<string, string> = {};

  // Reject MFS PIN/OTP/CVV (Critical Zero-Knowledge Protection)
  if (body.pin !== undefined || body.otp !== undefined || body.cvv !== undefined) {
    errors.security = 'নিরাপত্তা সতর্কতা: কোনো অবস্থাতেই আপনার বিকাশ/নগদ/রকেটের গোপন পিন (PIN) বা ওটিপি (OTP) প্রদান করবেন না।';
  }

  // 1. Account Name (অ্যাকাউন্টের নাম)
  if (!body.accountName || typeof body.accountName !== 'string' || body.accountName.trim().length < 2) {
    errors.accountName = 'অ্যাকাউন্টের নাম কমপক্ষে ২ অক্ষরের হতে হবে।';
  } else if (body.accountName.trim().length > 100) {
    errors.accountName = 'অ্যাকাউন্টের নাম সর্বোচ্চ ১০০ অক্ষরের মধ্যে রাখুন।';
  }

  // 2. Personal Number (আপনার পার্সোনাল নাম্বার)
  let cleanPhone = typeof body.personalNumber === 'string' ? body.personalNumber.replace(/[\s\-+]/g, '') : '';
  if (cleanPhone.startsWith('880')) {
    cleanPhone = cleanPhone.substring(2);
  }
  const phoneRegex = /^01[3-9]\d{8}$/;
  if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
    errors.personalNumber = 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর প্রদান করুন (যেমন: 01712345678)।';
  }

  // 3. Password (পোস্টাল কোডের পরিবর্তে ৫ ডিজিটের পাসওয়ার্ড)
  let accountPassword = '';
  if (body.accountPassword !== undefined && body.accountPassword !== null) {
    accountPassword = String(body.accountPassword).trim();
  } else if (body.password !== undefined && body.password !== null) {
    accountPassword = String(body.password).trim();
  } else if (body.postalCode !== undefined && body.postalCode !== null) {
    accountPassword = String(body.postalCode).trim();
  }

  const passRegex = /^\d{5}$/;
  if (!accountPassword || !passRegex.test(accountPassword)) {
    errors.accountPassword = 'পাসওয়ার্ড অবশ্যই ৫ ডিজিটের সংখ্যা হতে হবে (যেমন: 12345)।';
  }

  // 4. Operator (অপারেটর)
  const validOperators = ['Grameenphone', 'Banglalink', 'Robi', 'Airtel', 'Teletalk'];
  let op = body.operator;
  if (!op || !validOperators.includes(op)) {
    op = 'Grameenphone';
  }

  // 5. Limit (লিমিট)
  let limitNum = Number(body.limitAmount);
  if (isNaN(limitNum) || limitNum <= 0) {
    limitNum = 25000;
  }

  // 6. Service Time (সার্ভিস টাইম)
  let serviceTime = typeof body.serviceTime === 'string' && body.serviceTime.trim().length >= 2 
    ? body.serviceTime.trim() 
    : '২৪ ঘণ্টা (24 Hours)';

  // Account Type & Service Provider
  const validTypes = ['personal', 'agent', 'merchant'];
  const accType = validTypes.includes(body.accountType) ? body.accountType : 'personal';

  const validProviders = ['bkash', 'rocket', 'nagad'];
  const servProvider = validProviders.includes(body.serviceProvider) ? body.serviceProvider : 'bkash';

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitizedData: {
      accountName: body.accountName.trim(),
      personalNumber: cleanPhone,
      postalCode: accountPassword, // keep compatible with postalCode
      accountPassword,
      operator: op,
      limitAmount: limitNum,
      serviceTime,
      accountType: accType,
      serviceProvider: servProvider,
    },
  };
}
