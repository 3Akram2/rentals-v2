import { Injectable } from '@nestjs/common';
import { BuildingsService } from '../buildings/buildings.service';
import { PropertiesService } from '../properties/properties.service';
import { PaymentsService } from '../payments/payments.service';
import { ExpensesService } from '../expenses/expenses.service';

@Injectable()
export class ReportsService {
    constructor(
        private readonly buildingsService: BuildingsService,
        private readonly propertiesService: PropertiesService,
        private readonly paymentsService: PaymentsService,
        private readonly expensesService: ExpensesService,
    ) {}

    private getUnitNumber(unit: string): number {
        if (!unit) return 0;
        const arabicIndic = '\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669';
        const easternArabic = '\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9';
        const western = '0123456789';
        let result = unit.toString();
        for (let i = 0; i < 10; i++) {
            result = result.replace(new RegExp(arabicIndic[i], 'g'), western[i]);
            result = result.replace(new RegExp(easternArabic[i], 'g'), western[i]);
        }
        return parseInt(result) || 0;
    }

    private sortByUnit(a: any, b: any): number {
        const numA = this.getUnitNumber(a.unit);
        const numB = this.getUnitNumber(b.unit);
        if (numA !== numB) return numA - numB;
        return (a.unit || '').localeCompare(b.unit || '');
    }

    async getYearlyReport(buildingId: string, year: number, fromMonth = 1, toMonth = 12) {
        const properties = await this.propertiesService.findAll(
            { buildingId },
            { sort: { type: 1, unit: 1 } },
        );

        const propertyIds = properties.map((p: any) => p._id);
        const payments = await this.paymentsService.findAll({
            propertyId: { $in: propertyIds },
            year,
        });

        const paymentMap: Record<string, Record<number, number>> = {};
        payments.forEach((p: any) => {
            if (!paymentMap[p.propertyId]) paymentMap[p.propertyId] = {};
            paymentMap[p.propertyId][p.month] = p.amount;
        });

        const apartments = [];
        const stores = [];

        properties.forEach((prop: any) => {
            const propPayments = paymentMap[prop._id] || {};
            const months = [];
            let total = 0;

            for (let m = 1; m <= 12; m++) {
                const amount = propPayments[m] || 0;
                months.push(amount);
                if (m >= fromMonth && m <= toMonth) {
                    total += amount;
                }
            }

            const row = {
                _id: prop._id,
                unit: prop.unit,
                renterName: prop.renterName || '-',
                paymentType: prop.paymentType,
                months,
                total,
            };

            if (prop.type === 'apartment') apartments.push(row);
            else stores.push(row);
        });

        apartments.sort((a, b) => this.sortByUnit(a, b));
        stores.sort((a, b) => this.sortByUnit(a, b));

        const expenses = await this.expensesService.findAll(
            { buildingId, year },
            { sort: { createdAt: -1 } },
        );

        const buildingExpenses = expenses.filter((e: any) => !e.ownerGroupId);
        const buildingExpensesTotal = buildingExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
        const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);

        const apartmentsTotal = apartments.reduce((sum, a) => sum + a.total, 0);
        const storesTotal = stores.reduce((sum, s) => sum + s.total, 0);
        const totalIncome = apartmentsTotal + storesTotal;

        return {
            year,
            fromMonth,
            toMonth,
            apartments,
            stores,
            apartmentsTotal,
            storesTotal,
            totalIncome,
            expenses,
            totalExpenses,
            buildingExpensesTotal,
            netIncome: totalIncome - buildingExpensesTotal,
        };
    }
}
