# คู่มือการเขียน Unit Test ใน Lin-San API

## ภาพรวมของระบบ Testing

**Lin-San API** เป็น URL Shortener API ที่สร้างด้วย Node.js, Express และ MongoDB โดยใช้ **Jest** เป็น testing framework หลัก และมีการจัดการ Database Testing ด้วย **MongoDB Memory Server**

## โครงสร้างไฟล์ Test

```
tests/
├── setup.js                    # การตั้งค่า Database สำหรับการทดสอบ
├── controllers/
│   └── link.controller.test.js  # ทดสอบ Link Controller
├── middlewares/
│   └── validation.test.js       # ทดสอบ Validation Middleware
├── models/
│   └── link.model.test.js       # ทดสอบ Link Model
├── routes/
│   └── link.route.test.js       # ทดสอบ Link Routes (Integration Test)
├── utils/
│   ├── link.test.js            # ทดสอบ Link Utilities
│   └── response.test.js        # ทดสอบ Response Utilities
└── validations/
    └── link.test.js            # ทดสอบ Link Validation Schemas
```

## การตั้งค่า Testing Environment

### Dependencies ที่ใช้ในการทดสอบ

```json
{
  "devDependencies": {
    "@babel/core": "^7.23.0",
    "@babel/preset-env": "^7.23.0",
    "babel-jest": "^29.7.0",
    "jest": "^29.7.0",
    "mongodb-memory-server": "^9.1.1",
    "supertest": "^6.3.3"
  }
}
```

### Jest Configuration

```json
{
  "jest": {
    "testEnvironment": "node",
    "transform": {
      "^.+\\.js$": "babel-jest"
    },
    "testMatch": ["**/tests/**/*.test.js"],
    "collectCoverageFrom": [
      "controllers/**/*.js",
      "utils/**/*.js", 
      "validations/**/*.js",
      "middlewares/**/*.js",
      "models/**/*.js"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### Test Scripts

```json
{
  "scripts": {
    "test": "jest --detectOpenHandles --forceExit",
    "test:watch": "jest --watch --detectOpenHandles",
    "test:coverage": "jest --coverage --detectOpenHandles --forceExit"
  }
}
```

## Database Testing Setup (`tests/setup.js`)

ไฟล์นี้จัดการการตั้งค่า Database สำหรับการทดสอบโดยใช้ MongoDB Memory Server

### หน้าที่หลัก:

1. **`setupTestDB()`** - สร้าง MongoDB Memory Server และเชื่อมต่อ
2. **`teardownTestDB()`** - ลบ Database และปิดการเชื่อมต่อ
3. **`clearTestDB()`** - ล้างข้อมูลทั้งหมดใน Collections

```javascript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// ใช้งานใน Test Suite
beforeAll(async () => {
    await setupTestDB();
});

afterAll(async () => {
    await teardownTestDB();
});

beforeEach(async () => {
    await clearTestDB();
});
```

## การทดสอบ Controllers

### `tests/controllers/link.controller.test.js`

ทดสอบ Business Logic ของ Link Controller ทั้ง 3 functions:

#### 1. **createLink()**
- ✅ สร้าง Link ใหม่สำเร็จ
- ✅ จัดการ Database Errors
- Mock `generateUniqueShortCode` function

#### 2. **getHisClickLinks()**
- ✅ ดึง Click History ของ Link ที่มีอยู่
- ✅ Return 404 สำหรับ Link ที่ไม่มี
- ✅ จัดการ Links ที่ไม่มี Click History

#### 3. **redirectToLongUrl()**
- ✅ Redirect ไปยัง Long URL และบันทึก Click
- ✅ Return 404 สำหรับ Short Code ที่ไม่มี
- ✅ จัดการ Database Errors ขณะบันทึก Click

### ตัวอย่าง Test Case:

```javascript
test('should create a new link successfully', async () => {
    mockReq.body = { long_url: 'https://example.com' };

    await createLink(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Link created successfully',
        data: expect.objectContaining({
            long_url: 'https://example.com',
            short_code: 'ABCD'
        })
    });
});
```

## การทดสอบ Models

### `tests/models/link.model.test.js`

ทดสอบ MongoDB Schema และ Validation Rules:

#### Schema Validation Tests:
- ✅ สร้าง Valid Link
- ✅ Require `long_url` field
- ✅ Require `short_code` field
- ✅ Enforce Unique `short_code`

#### Click History Tests:
- ✅ เพิ่ม Click Data ใน `his_clicks` array

### ตัวอย่าง Test Case:

```javascript
test('should enforce unique short_code', async () => {
    await LinkModel.ensureIndexes();
    
    const link1 = new LinkModel({
        long_url: 'https://example1.com',
        short_code: 'abc123'
    });
    await link1.save();

    const link2 = new LinkModel({
        long_url: 'https://example2.com',
        short_code: 'abc123' // Duplicate
    });

    await expect(link2.save()).rejects.toThrow();
});
```

## การทดสอบ Routes (Integration Tests)

### `tests/routes/link.route.test.js`

ทดสอบ API Endpoints แบบ End-to-End โดยใช้ **Supertest**:

#### POST `/link`
- ✅ สร้าง Link ใหม่
- ✅ Reject Invalid URL
- ✅ Reject Missing `long_url`

#### GET `/link/his/:short_code`
- ✅ ดึง Click History สำหรับ Link ที่มีอยู่
- ✅ Return 404 สำหรับ Link ที่ไม่มี

#### GET `/link/:short_code`
- ✅ Redirect ไปยัง Long URL
- ✅ Return 404 สำหรับ Short Code ที่ไม่มี
- ✅ Reject Invalid Short Code Format

### ตัวอย่าง Integration Test:

```javascript
test('should create a new link', async () => {
    const response = await request(app)
        .post('/link')
        .send({ long_url: 'https://example.com' })
        .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('short_code');
});
```

## การทดสอบ Middlewares

### `tests/middlewares/validation.test.js`

ทดสอบ Validation Middleware ที่ใช้ Zod Schema:

#### Test Cases:
- ✅ Call `next()` เมื่อ Validation ผ่าน
- ✅ Return Error เมื่อ Validation ล้มเหลว
- ✅ จัดการ Non-Zod Errors

### ตัวอย่าง Test Case:

```javascript
test('should call next() when validation passes', () => {
    const schema = z.object({
        body: z.object({
            name: z.string()
        })
    });

    mockReq.body = { name: 'test' };

    const middleware = validate(schema);
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
});
```

## การทดสอบ Utils

### `tests/utils/link.test.js`

ทดสอบ Link Utilities:

#### `generateUniqueShortCode()` Tests:
- ✅ สร้าง Unique Short Code
- ✅ สร้าง Code ที่แตกต่างกันในแต่ละครั้ง
- ✅ หลีกเลี่ยง Short Code ที่มีอยู่แล้วใน Database

### `tests/utils/response.test.js`

ทดสอบ Response Utilities:

#### `successResponse()` Tests:
- ✅ Return Success Response พร้อม Default Status Code
- ✅ Return Success Response พร้อม Custom Status Code
- ✅ Return Success Response ไม่มี Data

#### `errorResponse()` Tests:
- ✅ Return Error Response พร้อม Default Status Code
- ✅ Return Error Response พร้อม Custom Status Code
- ✅ Return Error Response ไม่มี Errors

## การทดสอบ Validations

### `tests/validations/link.test.js`

ทดสอบ Zod Validation Schemas:

#### `createLinkSchema` Tests:
- ✅ Validate Valid URL (https/http)
- ❌ Reject Empty URL
- ❌ Reject Invalid URL Format
- ❌ Reject URLs ไม่มี http/https Protocol
- ❌ Reject URLs พร้อม XSS Content
- ❌ Reject JavaScript Protocol URLs
- ❌ Reject URLs ที่ยาวเกินไป (>2048 characters)
- ❌ Reject Missing `long_url`

#### `shortCodeSchema` Tests:
- ✅ Validate Valid Short Code (alphanumeric, ความยาวที่กำหนด)
- ❌ Reject Short Code สั้นเกินไป
- ❌ Reject Short Code ยาวเกินไป
- ❌ Reject Short Code ที่มี Special Characters
- ❌ Reject Short Code ที่มี Spaces
- ❌ Reject Missing `short_code`

### ตัวอย่าง Validation Test:

```javascript
test('should reject URLs with XSS content', () => {
    const invalidData = {
        body: {
            long_url: 'https://example.com/<script>alert("xss")</script>'
        }
    };

    expect(() => createLinkSchema.parse(invalidData)).toThrow();
});
```

## Testing Patterns และ Best Practices

### 1. **Mock Strategy**
```javascript
// Mock External Dependencies
jest.mock('../../utils/link.js', () => ({
    generateUniqueShortCode: jest.fn(() => Promise.resolve('ABCD'))
}));

// Mock Environment Config
jest.mock('../../configs/environment.js', () => ({
    SHORT_CODE_LENGTH: 4
}));
```

### 2. **Database Testing Pattern**
```javascript
beforeAll(async () => {
    await setupTestDB(); // ตั้งค่า MongoDB Memory Server
});

afterAll(async () => {
    await teardownTestDB(); // ปิดการเชื่อมต่อ
});

beforeEach(async () => {
    await clearTestDB(); // ล้างข้อมูลระหว่างแต่ละ Test
});
```

### 3. **Request/Response Mocking**
```javascript
beforeEach(() => {
    mockReq = {
        body: {},
        params: {},
        headers: {},
        ip: '192.168.1.1'
    };

    mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        redirect: jest.fn().mockReturnThis()
    };
});
```

### 4. **Integration Testing with Supertest**
```javascript
const app = express();
app.use(express.json());
app.use('/link', linkRoutes);

const response = await request(app)
    .post('/link')
    .send({ long_url: 'https://example.com' })
    .expect(201);
```

## Code Coverage Requirements

ระบบกำหนด **Coverage Threshold ที่ 80%** ในทุกด้าน:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## วิธีการรัน Tests

```bash
# รัน Tests ทั้งหมด
npm test

# รัน Tests แบบ Watch Mode
npm run test:watch

# รัน Tests พร้อม Coverage Report
npm run test:coverage
```

## สรุป

การออกแบบ Unit Tests ใน Lin-San API มีการครอบคลุมทุก Layer ของ Application:

1. **Controllers**: Business Logic Testing
2. **Models**: Database Schema & Validation Testing
3. **Routes**: Integration Testing
4. **Middlewares**: Request Processing Testing
5. **Utils**: Helper Functions Testing
6. **Validations**: Input Validation Testing

การใช้ **MongoDB Memory Server** ทำให้ Tests รันได้อย่างรวดเร็วและไม่ต้องพึ่งพา External Database ขณะทดสอบ ส่วนการใช้ **Supertest** ช่วยในการทดสอบ API Endpoints แบบ End-to-End ได้อย่างมีประสิทธิภาพ