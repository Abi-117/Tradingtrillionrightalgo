import { describe, expect, it } from 'vitest';
import { api } from '@/services/apiClient';
import { paymentService } from '@/services/paymentService';
import { level1Topics, level2Topics, site } from '@/config/site';
import { paymentSearch } from '@/components/site/PaymentStatus';
import { QueryClient } from '@tanstack/react-query';
import { createRouter, rootRouteId } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

describe('Business safety and supplied facts', () => {
 it('preserves separate course prices and advertised full package', () => {
  expect(site.course.level1+site.course.level2).toBe(34998);
  expect(site.course.package).toBe(35000);
  expect(level1Topics).toHaveLength(7);expect(level2Topics).toHaveLength(7);
  expect(site.software.price-site.software.discount).toBe(4999);
  expect(site.right.registrationFee).toBe(2000);
 });
 it('does not invent coupon codes or Right support details', () => {
  expect(site.course.coupons.every(c=>c.code==='')).toBe(true);
  expect(site.software.couponCode).toBe('');expect(site.right.supportPhone).toBe('');expect(site.right.supportEmail).toBe('');
 });
 it('never simulates a disconnected API success', async () => {
  await expect(api('/api/contact')).rejects.toThrow('not connected');
 });
 it('rejects mismatched business and product before creating an order', () => {
  const customer={name:'Test',email:'test@example.com',mobile:'9999999999'};
  expect(()=>paymentService.createOrder('RIGHT_ALGO_TRADING','SOFTWARE',customer)).toThrow('do not match');
  expect(()=>paymentService.createOrder('TRILLION_TRADING','REGISTRATION',customer)).toThrow('do not match');
 });
 it('parses a success URL without asserting payment success', () => {
  expect(paymentSearch({order:'test',business:'RIGHT_ALGO_TRADING'})).toEqual({order:'test',business:'RIGHT_ALGO_TRADING'});
  expect(paymentSearch({})).toEqual({order:'',business:'TRILLION_TRADING'});
 });
});
describe('Complete frontend routes', () => {
 const router=createRouter({routeTree,context:{queryClient:new QueryClient()}});
 for(const path of ['/','/trillion-trading','/right-algo-trading','/daily-report','/contact','/payment-success','/payment-failed','/member','/admin/reports','/policies/privacy','/policies/terms','/policies/refund','/policies/payment','/policies/risk']) {
  it(`matches ${path}`,()=>expect(router.matchRoutes(path).at(-1)?.routeId).not.toBe(rootRouteId));
 }
});
