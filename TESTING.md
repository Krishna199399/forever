# Testing Guidelines - ❤️ Her Rhythm ❤️

This file describes how to run automated checks on the wellness pages, API controllers, and database aggregations.

## 1. Frontend Component Testing
We recommend using **Vitest** + **React Testing Library** for JSX elements:

```typescript
import { render, screen } from '@testing-library/react';
import { Settings } from '../pages/Settings';

describe('Settings Page Components', () => {
  it('renders without crashing and displays hero greeting', () => {
    render(<Settings />);
    expect(screen.getByText('Handcrafted for you ❤️')).toBeInTheDocument();
  });

  it('allows selecting color themes', () => {
    render(<Settings />);
    const pinkThemeButton = screen.getByText('Forever Pink');
    expect(pinkThemeButton).toBeInTheDocument();
  });
});
```

To execute client tests:
```bash
cd client
npm run test
```

## 2. Backend Controller Integration Tests
Use **Supertest** to verify API endpoint returns and rate-limiters:

```javascript
import request from 'supertest';
import app from '../app';

describe('Water Tracker API endpoints', () => {
  it('GET /api/water - yields default water log values', async () => {
    const res = await request(app)
      .get('/api/water')
      .expect(200);
    expect(res.body).toHaveProperty('consumedCups');
  });

  it('POST /api/water - saves logged consumption', async () => {
    const res = await request(app)
      .post('/api/water')
      .send({ consumedCups: 4 })
      .expect(201);
    expect(res.body.consumedCups).toBe(4);
  });
});
```

To execute server tests:
```bash
cd server
npm run test
```
