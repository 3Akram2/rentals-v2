import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BuildingsService } from 'src/buildings/buildings.service';
import { PropertiesService } from 'src/properties/properties.service';
import { PaymentsService } from 'src/payments/payments.service';
import { BuildingAccessService } from 'src/app-auth/building-access.service';
import { User } from 'src/users/user.model';
import { BuildingAiChatRepo } from './building-ai-chat.repo';
import { BuildingAiPromptRepo } from './building-ai-prompt.repo';
import { UsersService } from 'src/users/users.service';
import { CreateAiPromptDto } from './dto/create-ai-prompt.dto';
import { UpdateAiPromptDto } from './dto/update-ai-prompt.dto';
import { Building } from 'src/buildings/building.model';
import { Property } from 'src/properties/property.model';
import { Payment } from 'src/payments/payment.model';

@Injectable()
export class BuildingAiService {
    private readonly model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    constructor(
        private readonly buildingsService: BuildingsService,
        private readonly propertiesService: PropertiesService,
        private readonly paymentsService: PaymentsService,
        private readonly usersService: UsersService,
        private readonly buildingAccessService: BuildingAccessService,
        private readonly chatRepo: BuildingAiChatRepo,
        private readonly promptRepo: BuildingAiPromptRepo,
    ) {}

    async askBuilding(
        actor: User,
        buildingId: string,
        question: string,
        history: Array<{ role: 'user' | 'assistant'; text: string }> = [],
    ) {
        const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
        if (!apiKey) {
            throw new BadRequestException('GROQ_API_KEY is missing on server');
        }

        await this.buildingAccessService.assertBuildingAccess(actor, buildingId);
        const building = await this.buildingsService.findById(buildingId);
        if (!building) throw new NotFoundException('Building not found');

        const nowYear = new Date().getFullYear();
        const prevYear = nowYear - 1;

        const properties = await this.propertiesService.findAll({ buildingId }, { sort: { unit: 1 } });
        const typedProperties = properties as Property[];
        const propertyIds = typedProperties.map((p) => String(p._id));

        const payments = propertyIds.length
            ? await this.paymentsService.findAll(
                  {
                      propertyId: { $in: propertyIds },
                      year: { $in: [nowYear, prevYear] },
                  },
                  { sort: { year: 1, month: 1 } },
              )
            : [];

        const typedPayments = payments as Payment[];
        const paymentsByProperty = new Map<string, Payment[]>();
        typedPayments.forEach((payment) => {
            const key = String(payment.propertyId);
            if (!paymentsByProperty.has(key)) paymentsByProperty.set(key, []);
            paymentsByProperty.get(key)?.push(payment);
        });

        const contextText = this.buildContextText(building as Building, typedProperties, paymentsByProperty, nowYear, prevYear);

        const activePrompt = await this.promptRepo.findOne({ active: true });
        const basePrompt =
            activePrompt?.content ||
            [
                'You are a rental-building assistant.',
                'Answer ONLY from the provided building context. Do not use external assumptions.',
                'If data is missing, say that it is not available in current records.',
                'Keep answers concise and numeric where possible.',
            ].join('\n');

        const contextMessage = [
            basePrompt,
            '',
            '=== BUILDING CONTEXT ===',
            contextText,
            '',
            'Important: payment amount is the actual paid money in records for each month.',
        ].join('\n');

        const normalizedHistory = (history || [])
            .filter((h) => h && typeof h.text === 'string' && (h.role === 'user' || h.role === 'assistant'))
            .slice(-12)
            .map((h) => ({ role: h.role, content: h.text }));

        const answer = await this.queryGroq(
            [
                { role: 'system', content: 'You are a rental-building assistant. Answer only from provided building context. If data is missing, say it is unavailable in records.' },
                { role: 'system', content: contextMessage },
                ...normalizedHistory,
                { role: 'user', content: question },
            ],
            apiKey,
        );

        await this.chatRepo.create({
            actorId: actor._id,
            buildingId,
            question,
            answer,
            model: this.model,
            currentYear: nowYear,
            previousYear: prevYear,
        });

        return {
            buildingId,
            years: [prevYear, nowYear],
            answer,
        };
    }

    async getDashboardOverview() {
        const [buildingsCount, unitsCount, usersCount, ownersAgg] = await Promise.all([
            this.buildingsService.count({}),
            this.propertiesService.count({}),
            this.usersService.count({
                deleted: { $ne: true },
                username: { $exists: true, $nin: [null, ''] },
                email: { $exists: true, $nin: [null, ''] },
            } as any),
            this.buildingsService.aggregatePipeline<{ total: number }>([
                { $unwind: { path: '$ownerGroups', preserveNullAndEmptyArrays: false } },
                { $unwind: { path: '$ownerGroups.members', preserveNullAndEmptyArrays: false } },
                {
                    $project: {
                        ownerKey: {
                            $cond: [
                                { $ifNull: ['$ownerGroups.members.userId', false] },
                                { $concat: ['id:', { $toString: '$ownerGroups.members.userId' }] },
                                {
                                    $concat: [
                                        'name:',
                                        {
                                            $trim: {
                                                input: { $toLower: { $ifNull: ['$ownerGroups.members.name', ''] } },
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
                { $match: { ownerKey: { $nin: ['name:'] } } },
                { $group: { _id: '$ownerKey' } },
                { $count: 'total' },
            ]),
        ]);

        const [recentChats, prompts] = await Promise.all([
            this.chatRepo.findAll(
                {},
                {
                    sort: { createdAt: -1 },
                    limit: 100,
                    populate: [
                        { path: 'actorId', select: 'name email username' },
                        { path: 'buildingId', select: 'number address' },
                    ],
                },
            ),
            this.promptRepo.findAll({}, { sort: { version: -1 }, limit: 50, populate: [{ path: 'createdBy', select: 'name email username' }] }),
        ]);

        return {
            stats: {
                buildings: buildingsCount.total,
                units: unitsCount.total,
                owners: ownersAgg?.[0]?.total || 0,
                loginUsers: usersCount.total,
                chats: recentChats.length,
            },
            prompts,
            recentChats,
        };
    }

    async listPrompts() {
        return this.promptRepo.findAll({}, { sort: { version: -1 }, limit: 100, populate: [{ path: 'createdBy', select: 'name email username' }] });
    }

    async createPrompt(actor: User, body: CreateAiPromptDto) {
        const latest = await this.promptRepo.findOne({}, { sort: { version: -1 } });
        const nextVersion = (latest?.version || 0) + 1;
        const hasActive = await this.promptRepo.findOne({ active: true });

        const prompt = await this.promptRepo.create({
            version: nextVersion,
            title: body.title || `Prompt v${nextVersion}`,
            content: body.content,
            active: !hasActive,
            createdBy: actor._id,
        });

        return prompt;
    }

    async updatePrompt(promptId: string, body: UpdateAiPromptDto) {
        const prompt = await this.promptRepo.findById(promptId);
        if (!prompt) throw new NotFoundException('Prompt not found');

        return this.promptRepo.updateById(promptId, {
            ...(body.title ? { title: body.title } : {}),
            ...(body.content ? { content: body.content } : {}),
        });
    }

    async activatePrompt(promptId: string) {
        const prompt = await this.promptRepo.findById(promptId);
        if (!prompt) throw new NotFoundException('Prompt not found');

        await this.promptRepo.updateMany({}, { $set: { active: false } });
        return this.promptRepo.updateById(promptId, { active: true });
    }

    private buildContextText(
        building: Building,
        properties: Property[],
        paymentsByProperty: Map<string, Payment[]>,
        nowYear: number,
        prevYear: number,
    ) {
        const lines: string[] = [];
        lines.push(`Building: ${building.number}${building.address ? ` - ${building.address}` : ''}`);
        lines.push(`Years included: ${prevYear}, ${nowYear}`);
        lines.push(`Units count: ${properties.length}`);
        lines.push('');

        if (!properties.length) {
            lines.push('No units exist in this building.');
            return lines.join('\n');
        }

        properties.forEach((property) => {
            const propertyId = String(property._id);
            const propertyPayments = (paymentsByProperty.get(propertyId) || []).sort(
                (a, b) => a.year - b.year || a.month - b.month,
            );

            lines.push(`Unit ${property.unit} (${property.type})`);
            lines.push(`Renter: ${property.renterName || 'N/A'}`);
            lines.push(`Fixed rent: ${property.fixedRent || 0}`);

            if (!propertyPayments.length) {
                lines.push('Payments: none for selected years.');
            } else {
                lines.push('Payments:');
                propertyPayments.forEach((p) => {
                    lines.push(`- ${p.year}-${String(p.month).padStart(2, '0')}: ${p.amount}`);
                });
            }
            lines.push('');
        });

        return lines.join('\n');
    }

    private async queryGroq(
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
        apiKey: string,
    ): Promise<string> {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                temperature: 0.1,
                max_tokens: 700,
            }),
        });

        const payload: any = await response.json();

        if (!response.ok) {
            const message = payload?.error?.message || 'Groq request failed';
            throw new BadRequestException(message);
        }

        const text = payload?.choices?.[0]?.message?.content || 'No answer generated.';
        return String(text).trim();
    }
}
