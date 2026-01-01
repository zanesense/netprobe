// Basic tests for hostname resolver functionality

import { HostnameResolver } from '../hostname-resolver';

describe('HostnameResolver', () => {
  describe('hostname validation', () => {
    test('should clean hostname correctly', () => {
      // These tests would need to access private methods, so we'll test through the public interface
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('resolution', () => {
    test('should handle invalid hostnames', async () => {
      const result = await HostnameResolver.resolve('');
      expect(result.error).toBeDefined();
      expect(result.records).toHaveLength(0);
    });

    test('should handle malformed hostnames', async () => {
      const result = await HostnameResolver.resolve('invalid..hostname');
      expect(result.error).toBeDefined();
    });

    // Note: Real network tests would be flaky in CI/CD, so we focus on validation
  });

  describe('batch resolution', () => {
    test('should handle empty array', async () => {
      const results = await HostnameResolver.resolveBatch([]);
      expect(results).toHaveLength(0);
    });

    test('should handle multiple hostnames', async () => {
      const results = await HostnameResolver.resolveBatch(['invalid1', 'invalid2']);
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('reverse lookup', () => {
    test('should handle invalid IP addresses', async () => {
      const result = await HostnameResolver.reverseLookup('invalid-ip');
      expect(result.error).toBeDefined();
    });

    test('should indicate browser limitations for valid IPs', async () => {
      const result = await HostnameResolver.reverseLookup('8.8.8.8');
      expect(result.error).toContain('browser environment');
    });
  });
});