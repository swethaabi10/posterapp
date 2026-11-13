import test from 'node:test';
import assert from 'node:assert/strict';

function isValidEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email);
}

function getRedirectPath(user: { role?: string } | null, defaultPath = '/dashboard'): string {
  if (user?.role === 'admin') return '/admin';
  return defaultPath;
}

test('email validation checks standard emails', () => {
  assert.equal(isValidEmail('bvashwin88@gmail.com'), true);
  assert.equal(isValidEmail('akashvishnu6680@gmail.com'), true);
  assert.equal(isValidEmail('invalid-email'), false);
  assert.equal(isValidEmail(''), false);
});

test('redirect path routes admin to /admin and regular users to /dashboard', () => {
  assert.equal(getRedirectPath({ role: 'admin' }), '/admin');
  assert.equal(getRedirectPath({ role: 'user' }), '/dashboard');
  assert.equal(getRedirectPath(null), '/dashboard');
});
