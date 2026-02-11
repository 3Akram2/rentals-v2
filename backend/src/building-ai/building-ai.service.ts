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

@Injectable()
export class BuildingAiService {
    private readonly model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    constructor(
        private readonly buildingsService: BuildingsService,
        private readonly propertiesService: PropertiesService,
        private readonly paymentsService: PaymentsService,
        private readonly usersService: UsersService,
        private readonly buildingAccessService: BuildingAccessService,
        private readonly chatRepo: BuildingAiChatRepo,
        private readonly promptRepo: BuildingAiPromptRepo,
    ) {}

    async askBuilding(actor: User, buildingId: string, question: string) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new BadRequestException('GEMINI_API_KEY is missing on server');
        }

        await this.buildingAccessService.assertBuildingAccess(actor, buildingId);
        const building = await this.buildingsService.findById(buildingId);
        if (!building) throw new NotFoundException('Building not found');

        const nowYear = new Date().getFullYear();
        const prevYear = nowYear - 1;

        const properties = await this.propertiesService.findAll({ buildingId }, { sort: { unit: 1 } });
        const propertyIds = properties.map((p: any) => String(p._id));

        const payments = propertyIds.length
            ? await this.paymentsService.findAll(
                  {
                      propertyId: { $in: propertyIds },
                      year: { $in: [nowYear, prevYear] },
                  },
                  { sort: { year: 1, month: 1 } },
              )
            : [];

        const paymentsByProperty = new Map<string, any[]>();
        payments.forEach((payment: any) => {
            const key = String(payment.propertyId);
            if (!paymentsByProperty.has(key)) paymentsByProperty.set(key, []);
            paymentsByProperty.get(key)?.push(payment);
        });

        const contextText = this.buildContextText(building as any, properties as any[], paymentsByProperty, nowYear, prevYear);

        const activePrompt = await this.promptRepo.findOne({ active: true } as any);
        const basePrompt =
            activePrompt?.content ||
            [
                'You are a rental-building assistant.',
                'Answer ONLY from the provided building context. Do not use external assumptions.',
                'If data is missing, say that it is not available in current records.',
                'Keep answers concise and numeric where possible.',
            ].join('\n');

        const prompt = [
            basePrompt,
            '',
            '=== BUILDING CONTEXT ===',
            contextText,
            '',
            '=== USER QUESTION ===',
            question,
        ].join('\n');

        const answer = await this.queryGemini(prompt, apiKey);

        await this.chatRepo.create({
            actorId: (actor as any)._id,
            buildingId,
            question,
            answer,
            model: this.model,
            currentYear: nowYear,
            previousYear: prevYear,
        } as any);

        return {
            buildingId,
            years: [prevYear, nowYear],
            answer,
        };
    }

    async getDashboardOverview() {
        const [buildingsCount, unitsCount, usersCount] = await Promise.all([
            this.buildingsService.count({}),
            this.propertiesService.count({}),
            this.usersService.count({ deleted: { $ne: true } } as any),
        ]);

        const buildings = await this.buildingsService.findAll({}, { projection: { ownerGroups: 1 } as any });
        const ownerSet = new Set<string>();

        (buildings as any[]).forEach((building) => {
            (building.ownerGroups || []).forEach((group: any) => {
                (group.members || []).forEach((member: any) => {
                    if (member.userId) ownerSet.add(String(member.userId));
                    else if (member.name) ownerSet.add(`name:${String(member.name).trim().toLowerCase()}`);
                });
            });
        });

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
                owners: ownerSet.size,
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
        const hasActive = await this.promptRepo.findOne({ active: true } as any);

        const prompt = await this.promptRepo.create({
            version: nextVersion,
            title: body.title || `Prompt v${nextVersion}`,
            content: body.content,
            active: !hasActive,
            createdBy: (actor as any)._id,
        } as any);

        return prompt;
    }

    async updatePrompt(promptId: string, body: UpdateAiPromptDto) {
        const prompt = await this.promptRepo.findById(promptId);
        if (!prompt) throw new NotFoundException('Prompt not found');

        return this.promptRepo.updateById(promptId, {
            ...(body.title ? { title: body.title } : {}),
            ...(body.content ? { content: body.content } : {}),
        } as any);
    }

    async activatePrompt(promptId: string) {
        const prompt = await this.promptRepo.findById(promptId);
        if (!prompt) throw new NotFoundException('Prompt not found');

        await this.promptRepo.updateMany({}, { $set: { active: false } } as any);
        return this.promptRepo.updateById(promptId, { active: true } as any);
    }

    private buildContextText(
        building: any,
        properties: any[],
        paymentsByProperty: Map<string, any[]>,
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

    private async queryGemini(prompt: string, apiKey: string): Promise<string> {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        topP: 0.9,
                        maxOutputTokens: 700,
                    },
                }),
            },
        );

        const payload: any = await response.json();

        if (!response.ok) {
            const message = payload?.error?.message || 'Gemini request failed';
            throw new BadRequestException(message);
        }

        const text =
            payload?.candidates?.[0]?.content?.parts
                ?.map((part: any) => part?.text)
                .filter(Boolean)
                .join('\n') || 'No answer generated.';

        return text;
    }
}
