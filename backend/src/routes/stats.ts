import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { statsQuerySchema } from '../schemas/index.js';
import { validateQuery } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

function getPeriodStart(period: 'day' | 'week'): Date {
  const now = new Date();
  if (period === 'day') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  return start;
}

router.get('/', authenticate, requireRole('owner'), validateQuery(statsQuerySchema), async (req, res) => {
  const period = (req.query.period as 'day' | 'week') ?? 'day';
  const since = getPeriodStart(period);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: since },
      status: { notIn: ['cancelled'] },
    },
    include: { items: true },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const orderCount = orders.length;

  const drinkStats = new Map<string, { name: string; count: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = drinkStats.get(item.drinkId) ?? {
        name: item.drinkName,
        count: 0,
        revenue: 0,
      };
      existing.count += item.quantity;
      existing.revenue += Number(item.subtotal);
      drinkStats.set(item.drinkId, existing);
    }
  }

  const popularDrinks = [...drinkStats.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({
    period,
    since: since.toISOString(),
    orderCount,
    totalRevenue,
    popularDrinks,
    statusBreakdown: {
      pending: orders.filter((o) => o.status === 'pending').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    },
  });
});

router.get('/export', authenticate, requireRole('owner'), validateQuery(statsQuerySchema), async (req, res) => {
  const period = (req.query.period as 'day' | 'week') ?? 'week';
  const since = getPeriodStart(period);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { notIn: ['cancelled'] } },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
  });

  const header = 'id,date,customer,phone,status,total,items\n';
  const rows = orders.map((o) => {
    const itemsStr = o.items.map((i) => `${i.drinkName}(${i.size})x${i.quantity}`).join('; ');
    return [
      o.id,
      o.createdAt.toISOString(),
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.customerPhone,
      o.status,
      Number(o.total),
      `"${itemsStr.replace(/"/g, '""')}"`,
    ].join(',');
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=orders-${period}.csv`);
  res.send('\uFEFF' + header + rows.join('\n'));
});

export default router;
