'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    AlertCircle,
    CheckCircle2,
    ClipboardList,
    FlaskConical,
    Loader2,
    Plus,
    RefreshCcw,
    ShieldCheck,
    Sparkles,
    Target,
    Trash2,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn, formatDate } from '@/lib/utils'
import { createDrugRuleFactor, fetchDrugRuleFactors } from '@/lib/api/drug-rule-factors'
import {
    createDrugRule,
    deactivateDrugRule,
    evaluateDrugRules,
    fetchDrugRulesByPack,
    updateDrugRule,
} from '@/lib/api/drug-rules'
import {
    DrugPack,
    DrugRule,
    DrugRuleCondition,
    DrugRuleEvaluationResponse,
    DrugRuleFactor,
    DrugRuleOperator,
    DrugRuleType,
} from '@/types'

const RULE_TYPES: { value: DrugRuleType; label: string; helper: string }[] = [
    { value: 'AGE_ELIGIBILITY', label: 'Age eligibility', helper: 'Allow or deny dispensing by age criteria.' },
    { value: 'CONTRAINDICATION', label: 'Contraindication', helper: 'Flag rules for conflicting conditions or factors.' },
    { value: 'QTY_LIMIT', label: 'Quantity limit', helper: 'Restrict dispensing quantity per claim or date range.' },
    { value: 'PRICE_ADJUSTMENT', label: 'Price adjustment', helper: 'Apply discounts or markups for matching claims.' },
]

const OPERATORS: { value: DrugRuleOperator; label: string; hint: string }[] = [
    { value: 'EQUALS', label: 'Equals (=)', hint: 'Matches an exact value.' },
    { value: 'GREATER_THAN', label: 'Greater than (>)', hint: 'Value must be higher than the threshold.' },
    { value: 'LESS_THAN', label: 'Less than (<)', hint: 'Value must be lower than the threshold.' },
    { value: 'BETWEEN', label: 'Between', hint: 'Provide a range (inclusive).' },
    { value: 'IN', label: 'One of', hint: 'Comma-separated list of allowed values.' },
]

interface ConditionDraft {
    id: string
    factorCode: string
    operator: DrugRuleOperator
    valueExact: string
    valueFrom: string
    valueTo: string
    multiValueInput: string
}

interface EvaluationFactorDraft {
    id: string
    factorCode: string
    value: string
}

interface RuleFormState {
    ruleType: DrugRuleType
    priority: string
    validFrom: string
    validTo: string
    description: string
    maxQuantity: string
    adjustmentValue: string
    eligibility: boolean
}

interface PackRulesDialogProps {
    pack: DrugPack | null
    onClose: () => void
}

const numberFormatter = new Intl.NumberFormat('en-US')

function generateDraftId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random()}`
}

function buildEmptyCondition(factors: DrugRuleFactor[]): ConditionDraft {
    return {
        id: generateDraftId(),
        factorCode: factors[0]?.code ?? '',
        operator: 'EQUALS',
        valueExact: '',
        valueFrom: '',
        valueTo: '',
        multiValueInput: '',
    }
}

function buildEvaluationFactorDraft(factors: DrugRuleFactor[]): EvaluationFactorDraft {
    return {
        id: generateDraftId(),
        factorCode: factors[0]?.code ?? '',
        value: '',
    }
}

function mapConditionToDraft(condition: DrugRuleCondition): ConditionDraft {
    return {
        id: generateDraftId(),
        factorCode: condition.factorCode,
        operator: condition.operator,
        valueExact: condition.valueExact ?? '',
        valueFrom: condition.valueFrom ?? '',
        valueTo: condition.valueTo ?? '',
        multiValueInput: condition.values ? condition.values.join(', ') : '',
    }
}

function describeCondition(condition: DrugRuleCondition): string {
    const operatorLabel = OPERATORS.find((operator) => operator.value === condition.operator)?.label ?? condition.operator

    if (condition.operator === 'BETWEEN') {
        return `${condition.factorCode} between ${condition.valueFrom ?? '—'} and ${condition.valueTo ?? '—'}`
    }
    if (condition.operator === 'IN') {
        const values = condition.values && condition.values.length > 0 ? condition.values.join(', ') : condition.valueExact ?? '—'
        return `${condition.factorCode} in [${values}]`
    }
    return `${condition.factorCode} ${operatorLabel} ${condition.valueExact ?? condition.valueFrom ?? condition.valueTo ?? '—'}`
}

function buildInitialRuleForm(): RuleFormState {
    return {
        ruleType: 'AGE_ELIGIBILITY',
        priority: '1',
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: '',
        description: '',
        maxQuantity: '',
        adjustmentValue: '',
        eligibility: true,
    }
}

export function PackRulesDialog({ pack, onClose }: PackRulesDialogProps) {
    const [activeTab, setActiveTab] = useState<'rules' | 'builder' | 'evaluate' | 'factors'>('rules')
    const [loadingRules, setLoadingRules] = useState(false)
    const [rules, setRules] = useState<DrugRule[]>([])
    const [rulesError, setRulesError] = useState<string | null>(null)
    const [showActiveOnly, setShowActiveOnly] = useState(true)

    const [factors, setFactors] = useState<DrugRuleFactor[]>([])
    const [loadingFactors, setLoadingFactors] = useState(false)
    const [factorForm, setFactorForm] = useState({ code: '', description: '' })
    const [savingFactor, setSavingFactor] = useState(false)
    const [factorError, setFactorError] = useState<string | null>(null)

    const [ruleForm, setRuleForm] = useState<RuleFormState>(buildInitialRuleForm())
    const [conditions, setConditions] = useState<ConditionDraft[]>([])
    const [ruleFormError, setRuleFormError] = useState<string | null>(null)
    const [savingRule, setSavingRule] = useState(false)
    const [editingRule, setEditingRule] = useState<DrugRule | null>(null)
    const [deactivatingRuleId, setDeactivatingRuleId] = useState<number | null>(null)

    const [evaluationFactors, setEvaluationFactors] = useState<EvaluationFactorDraft[]>([])
    const [evaluationDate, setEvaluationDate] = useState(() => new Date().toISOString().slice(0, 10))
    const [evaluationResult, setEvaluationResult] = useState<DrugRuleEvaluationResponse | null>(null)
    const [evaluating, setEvaluating] = useState(false)
    const [evaluationError, setEvaluationError] = useState<string | null>(null)

    const dialogOpen = Boolean(pack)

    const loadRules = useCallback(async () => {
        if (!pack) return
        setLoadingRules(true)
        setRulesError(null)
        try {
            const data = await fetchDrugRulesByPack(pack.id)
            setRules(data)
        } catch (error) {
            console.error(error)
            setRules([])
            setRulesError(error instanceof Error ? error.message : 'Unable to load rules')
        } finally {
            setLoadingRules(false)
        }
    }, [pack])

    const loadFactors = useCallback(async () => {
        setLoadingFactors(true)
        setFactorError(null)
        try {
            const data = await fetchDrugRuleFactors()
            setFactors(data)
        } catch (error) {
            console.error(error)
            setFactors([])
            setFactorError(error instanceof Error ? error.message : 'Unable to load rule factors')
        } finally {
            setLoadingFactors(false)
        }
    }, [])

    useEffect(() => {
        if (!pack) return
        void loadRules()
        void loadFactors()
        setRuleForm(buildInitialRuleForm())
        setConditions([])
        setEditingRule(null)
        setRuleFormError(null)
        setEvaluationResult(null)
        setEvaluationError(null)
        setEvaluationFactors([buildEvaluationFactorDraft([])])
        setActiveTab('rules')
    }, [pack, loadRules, loadFactors])

    useEffect(() => {
        if (conditions.length === 0 && factors.length > 0) {
            setConditions([buildEmptyCondition(factors)])
        }
        if (evaluationFactors.length === 0 && factors.length > 0) {
            setEvaluationFactors([buildEvaluationFactorDraft(factors)])
        }
        if (
            factors.length > 0 &&
            evaluationFactors.length === 1 &&
            !evaluationFactors[0]?.factorCode
        ) {
            setEvaluationFactors([buildEvaluationFactorDraft(factors)])
        }
    }, [conditions.length, evaluationFactors, factors])

    const visibleRules = useMemo(() => {
        return showActiveOnly ? rules.filter((rule) => rule.isActive) : rules
    }, [rules, showActiveOnly])

    const handleRuleFormChange = (field: keyof RuleFormState, value: string | boolean) => {
        setRuleForm((prev) => ({ ...prev, [field]: value }))
        setRuleFormError(null)
    }

    const handleConditionChange = (id: string, updates: Partial<ConditionDraft>) => {
        setConditions((prev) => prev.map((condition) => (condition.id === id ? { ...condition, ...updates } : condition)))
        setRuleFormError(null)
    }

    const handleAddCondition = () => {
        if (factors.length === 0) {
            setRuleFormError('Define factors before adding conditions.')
            return
        }
        setConditions((prev) => [...prev, buildEmptyCondition(factors)])
    }

    const handleRemoveCondition = (id: string) => {
        setConditions((prev) => (prev.length === 1 ? prev : prev.filter((condition) => condition.id !== id)))
    }

    const resetRuleForm = () => {
        setRuleForm(buildInitialRuleForm())
        setConditions(factors.length > 0 ? [buildEmptyCondition(factors)] : [])
        setEditingRule(null)
        setRuleFormError(null)
    }

    const buildConditionPayload = (draft: ConditionDraft): DrugRuleCondition => {
        const values = draft.multiValueInput
            .split(',')
            .map((value) => value.trim())
            .filter((value) => value.length > 0)

        return {
            factorCode: draft.factorCode,
            operator: draft.operator,
            valueExact:
                draft.operator === 'EQUALS' || draft.operator === 'GREATER_THAN' || draft.operator === 'LESS_THAN'
                    ? draft.valueExact || (values.length > 0 ? values[0] : null)
                    : null,
            valueFrom: draft.operator === 'BETWEEN' ? draft.valueFrom || null : null,
            valueTo: draft.operator === 'BETWEEN' ? draft.valueTo || null : null,
            values: draft.operator === 'IN' ? values : undefined,
        }
    }

    const handleSaveRule = async () => {
        if (!pack) return
        if (!ruleForm.priority.trim()) {
            setRuleFormError('Priority is required.')
            return
        }
        if (conditions.length === 0) {
            setRuleFormError('Add at least one condition to this rule.')
            return
        }
        if (conditions.some((condition) => !condition.factorCode)) {
            setRuleFormError('Each condition must target a factor.')
            return
        }

        const payload = {
            drugPackId: pack.id,
            ruleType: ruleForm.ruleType,
            priority: Number(ruleForm.priority) || 0,
            maxQuantity: ruleForm.maxQuantity !== '' ? Number(ruleForm.maxQuantity) : null,
            adjustmentValue: ruleForm.adjustmentValue !== '' ? Number(ruleForm.adjustmentValue) : null,
            validFrom: ruleForm.validFrom || null,
            validTo: ruleForm.validTo || null,
            description: ruleForm.description.trim(),
            conditions: conditions.map((condition) => buildConditionPayload(condition)),
            eligibility: typeof ruleForm.eligibility === 'boolean' ? ruleForm.eligibility : undefined,
        }

        setSavingRule(true)
        setRuleFormError(null)
        try {
            if (editingRule) {
                await updateDrugRule(editingRule.id, payload)
            } else {
                await createDrugRule(payload)
            }
            await loadRules()
            resetRuleForm()
            setActiveTab('rules')
        } catch (error) {
            console.error(error)
            setRuleFormError(error instanceof Error ? error.message : 'Unable to save rule')
        } finally {
            setSavingRule(false)
        }
    }

    const handleEditRule = (rule: DrugRule) => {
        setActiveTab('builder')
        setEditingRule(rule)
        setRuleForm({
            ruleType: rule.ruleType,
            priority: String(rule.priority ?? ''),
            validFrom: rule.validFrom ?? '',
            validTo: rule.validTo ?? '',
            description: rule.description ?? '',
            maxQuantity: rule.maxQuantity !== null && rule.maxQuantity !== undefined ? String(rule.maxQuantity) : '',
            adjustmentValue:
                rule.adjustmentValue !== null && rule.adjustmentValue !== undefined ? String(rule.adjustmentValue) : '',
            eligibility: typeof rule.eligibility === 'boolean' ? rule.eligibility : true,
        })
        setConditions(rule.conditions.length > 0 ? rule.conditions.map((condition) => mapConditionToDraft(condition)) : [])
        setRuleFormError(null)
    }

    const handleDeactivateRule = async (rule: DrugRule) => {
        setDeactivatingRuleId(rule.id)
        try {
            await deactivateDrugRule(rule.id)
            await loadRules()
        } catch (error) {
            console.error(error)
            setRulesError(error instanceof Error ? error.message : 'Unable to deactivate rule')
        } finally {
            setDeactivatingRuleId(null)
        }
    }

    const handleEvaluate = async () => {
        if (!pack) return
        const payloadFactors: Record<string, string> = {}
        evaluationFactors.forEach((factor) => {
            if (factor.factorCode && factor.value.trim()) {
                payloadFactors[factor.factorCode] = factor.value.trim()
            }
        })
        if (!evaluationDate) {
            setEvaluationError('Evaluation date is required.')
            return
        }
        setEvaluating(true)
        setEvaluationError(null)
        setEvaluationResult(null)
        try {
            const result = await evaluateDrugRules(pack.id, { date: evaluationDate, factors: payloadFactors })
            setEvaluationResult(result)
        } catch (error) {
            console.error(error)
            setEvaluationError(error instanceof Error ? error.message : 'Unable to evaluate rules')
        } finally {
            setEvaluating(false)
        }
    }

    const handleAddEvaluationFactor = () => {
        if (factors.length === 0) {
            setEvaluationError('Create rule factors before evaluating scenarios.')
            return
        }
        setEvaluationFactors((prev) => [...prev, buildEvaluationFactorDraft(factors)])
    }

    const handleEvaluationFactorChange = (id: string, updates: Partial<EvaluationFactorDraft>) => {
        setEvaluationFactors((prev) => prev.map((factor) => (factor.id === id ? { ...factor, ...updates } : factor)))
        setEvaluationError(null)
    }

    const handleCreateFactor = async () => {
        if (!factorForm.code.trim() || !factorForm.description.trim()) {
            setFactorError('Code and description are required.')
            return
        }
        setSavingFactor(true)
        setFactorError(null)
        try {
            await createDrugRuleFactor({
                code: factorForm.code.trim(),
                description: factorForm.description.trim(),
            })
            setFactorForm({ code: '', description: '' })
            await loadFactors()
        } catch (error) {
            console.error(error)
            setFactorError(error instanceof Error ? error.message : 'Unable to create factor')
        } finally {
            setSavingFactor(false)
        }
    }

    const dialogTitle = pack ? `Rule engine — ${pack.packCode}` : 'Rule engine'

    return (
        <Dialog open={dialogOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-6xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-tpa-primary" /> {dialogTitle}
                    </DialogTitle>
                    <DialogDescription>
                        Configure eligibility, quantity limits, and price adjustments for this pack. Active rules are evaluated in
                        priority order.
                    </DialogDescription>
                </DialogHeader>

                {pack && (
                    <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">{pack.packCode}</p>
                        <p className="text-xs text-slate-600">
                            {pack.unitOfMeasure || '—'} • {pack.unitsPerPack || 0} units • Min {pack.minDispenseQuantity || 0} / Max{' '}
                            {pack.maxDispenseQuantity || 0}
                        </p>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="rules">Rules</TabsTrigger>
                        <TabsTrigger value="builder">Builder</TabsTrigger>
                        <TabsTrigger value="evaluate">Evaluate</TabsTrigger>
                        <TabsTrigger value="factors">Factors</TabsTrigger>
                    </TabsList>

                    <TabsContent value="rules" className="space-y-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Configured rules</p>
                                <p className="text-xs text-gray-600">Rules run in descending priority. Lower number = higher priority.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Switch id="rules-active-only" checked={showActiveOnly} onCheckedChange={setShowActiveOnly} />
                                    <Label htmlFor="rules-active-only" className="text-sm">
                                        Active only
                                    </Label>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => void loadRules()}>
                                    <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
                                </Button>
                                <Button size="sm" className="bg-tpa-primary hover:bg-tpa-accent" onClick={() => setActiveTab('builder')}>
                                    <Plus className="h-4 w-4 mr-2" /> New rule
                                </Button>
                            </div>
                        </div>

                        {rulesError && <p className="text-sm text-red-600">{rulesError}</p>}

                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rule</TableHead>
                                        <TableHead className="text-center">Priority</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead>Validity</TableHead>
                                        <TableHead>Conditions</TableHead>
                                        <TableHead>Result</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingRules ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-6 text-sm text-gray-500">
                                                <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading rules...
                                            </TableCell>
                                        </TableRow>
                                    ) : visibleRules.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-6 text-sm text-gray-500">
                                                No rules available.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        visibleRules.map((rule) => (
                                            <TableRow key={rule.id} className="align-top">
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-semibold text-gray-900">{rule.ruleType.replace('_', ' ')}</span>
                                                        <p className="text-xs text-gray-600">{rule.description || 'No description provided.'}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-semibold text-gray-800">{rule.priority}</TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-semibold',
                                                            rule.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600',
                                                        )}
                                                    >
                                                        {rule.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {rule.validFrom ? formatDate(rule.validFrom) : '—'} → {rule.validTo ? formatDate(rule.validTo) : 'Open-ended'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1 text-xs text-gray-700">
                                                        {rule.conditions.map((condition, index) => (
                                                            <p key={`${rule.id}-condition-${index}`}>{describeCondition(condition)}</p>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-gray-700 space-y-1">
                                                        <p>
                                                            <span className="font-semibold">Max Qty:</span> {rule.maxQuantity ?? '—'}
                                                        </p>
                                                        <p>
                                                            <span className="font-semibold">Adjustment:</span>{' '}
                                                            {rule.adjustmentValue !== null && rule.adjustmentValue !== undefined
                                                                ? `${rule.adjustmentValue > 0 ? '+' : ''}${rule.adjustmentValue}`
                                                                : '—'}
                                                        </p>
                                                        {typeof rule.eligibility === 'boolean' && (
                                                            <p>
                                                                <span className="font-semibold">Eligibility:</span>{' '}
                                                                {rule.eligibility ? 'Eligible' : 'Not eligible'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="outline" size="icon" onClick={() => handleEditRule(rule)}>
                                                            <Sparkles className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => void handleDeactivateRule(rule)}
                                                            disabled={deactivatingRuleId === rule.id}
                                                        >
                                                            {deactivatingRuleId === rule.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="builder" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="rule-type">Rule type</Label>
                                        <Select value={ruleForm.ruleType} onValueChange={(value) => handleRuleFormChange('ruleType', value)}>
                                            <SelectTrigger id="rule-type">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {RULE_TYPES.map((ruleType) => (
                                                    <SelectItem key={ruleType.value} value={ruleType.value}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{ruleType.label}</span>
                                                            <span className="text-xs text-gray-500">{ruleType.helper}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rule-priority">Priority</Label>
                                        <Input
                                            id="rule-priority"
                                            type="number"
                                            min="0"
                                            value={ruleForm.priority}
                                            onChange={(event) => handleRuleFormChange('priority', event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rule-valid-from">Valid from</Label>
                                        <Input
                                            id="rule-valid-from"
                                            type="date"
                                            value={ruleForm.validFrom}
                                            onChange={(event) => handleRuleFormChange('validFrom', event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rule-valid-to">Valid to</Label>
                                        <Input
                                            id="rule-valid-to"
                                            type="date"
                                            value={ruleForm.validTo}
                                            onChange={(event) => handleRuleFormChange('validTo', event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rule-max-quantity">Max allowed quantity</Label>
                                        <Input
                                            id="rule-max-quantity"
                                            type="number"
                                            min="0"
                                            value={ruleForm.maxQuantity}
                                            onChange={(event) => handleRuleFormChange('maxQuantity', event.target.value)}
                                            placeholder="Leave empty for unlimited"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rule-adjustment">Price adjustment</Label>
                                        <Input
                                            id="rule-adjustment"
                                            type="number"
                                            value={ruleForm.adjustmentValue}
                                            onChange={(event) => handleRuleFormChange('adjustmentValue', event.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Eligibility result</Label>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                id="rule-eligibility"
                                                checked={ruleForm.eligibility}
                                                onCheckedChange={(checked) => handleRuleFormChange('eligibility', checked)}
                                            />
                                            <Label htmlFor="rule-eligibility" className="text-sm text-gray-600">
                                                {ruleForm.eligibility ? 'Eligible when rule matches' : 'Block dispensing when rule matches'}
                                            </Label>
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="rule-description">Description</Label>
                                        <Textarea
                                            id="rule-description"
                                            rows={3}
                                            value={ruleForm.description}
                                            onChange={(event) => handleRuleFormChange('description', event.target.value)}
                                            placeholder="Add notes to help clinicians understand this rule"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg border p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Conditions</p>
                                            <p className="text-xs text-gray-600">All conditions are combined using AND logic.</p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={handleAddCondition} disabled={factors.length === 0}>
                                            <Plus className="h-4 w-4 mr-2" /> Add condition
                                        </Button>
                                    </div>

                                    {conditions.length === 0 ? (
                                        <p className="text-sm text-gray-500">No conditions added yet.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {conditions.map((condition) => (
                                                <div key={condition.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 rounded-lg border p-3">
                                                    <div className="space-y-2">
                                                        <Label>Factor</Label>
                                                        <Select
                                                            value={condition.factorCode || undefined}
                                                            onValueChange={(value) => handleConditionChange(condition.id, { factorCode: value })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select factor" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {factors.map((factor) => (
                                                                    <SelectItem key={factor.code} value={factor.code}>
                                                                        {factor.code} — {factor.description}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Operator</Label>
                                                        <Select
                                                            value={condition.operator}
                                                            onValueChange={(value) =>
                                                                handleConditionChange(condition.id, { operator: value as DrugRuleOperator })
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Operator" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {OPERATORS.map((operator) => (
                                                                    <SelectItem key={operator.value} value={operator.value}>
                                                                        {operator.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {condition.operator === 'BETWEEN' ? (
                                                        <>
                                                            <div className="space-y-2">
                                                                <Label>From</Label>
                                                                <Input
                                                                    value={condition.valueFrom}
                                                                    onChange={(event) =>
                                                                        handleConditionChange(condition.id, { valueFrom: event.target.value })
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>To</Label>
                                                                <Input
                                                                    value={condition.valueTo}
                                                                    onChange={(event) =>
                                                                        handleConditionChange(condition.id, { valueTo: event.target.value })
                                                                    }
                                                                />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label>{condition.operator === 'IN' ? 'Values' : 'Value'}</Label>
                                                            <Input
                                                                value={condition.operator === 'IN' ? condition.multiValueInput : condition.valueExact}
                                                                onChange={(event) =>
                                                                    handleConditionChange(
                                                                        condition.id,
                                                                        condition.operator === 'IN'
                                                                            ? { multiValueInput: event.target.value }
                                                                            : { valueExact: event.target.value },
                                                                    )
                                                                }
                                                                placeholder={condition.operator === 'IN' ? 'e.g. female, pregnant' : 'Value'}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex items-end justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600"
                                                            onClick={() => handleRemoveCondition(condition.id)}
                                                            disabled={conditions.length === 1}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" /> Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {ruleFormError && <p className="text-sm text-red-600">{ruleFormError}</p>}

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" onClick={resetRuleForm}>
                                        Reset
                                    </Button>
                                    <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={() => void handleSaveRule()} disabled={savingRule}>
                                        {savingRule ? 'Saving...' : editingRule ? 'Update rule' : 'Create rule'}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
                                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                        <ClipboardList className="h-4 w-4" /> Rule summary
                                    </p>
                                    <p className="text-xs text-gray-600">Preview how this rule will behave when activated.</p>
                                    <div className="space-y-1 text-sm text-gray-700">
                                        <p>
                                            <span className="font-semibold">Type:</span> {ruleForm.ruleType.replace('_', ' ')}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Priority:</span> {ruleForm.priority || '—'}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Max Qty:</span> {ruleForm.maxQuantity || '—'}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Adjustment:</span> {ruleForm.adjustmentValue || '—'}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Eligibility:</span> {ruleForm.eligibility ? 'Eligible' : 'Not eligible'}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Conditions:</span> {conditions.length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="evaluate" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                    <FlaskConical className="h-4 w-4" /> Simulation context
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="evaluation-date">Date</Label>
                                    <Input
                                        id="evaluation-date"
                                        type="date"
                                        value={evaluationDate}
                                        onChange={(event) => setEvaluationDate(event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Factors</Label>
                                        <Button variant="outline" size="sm" onClick={handleAddEvaluationFactor} disabled={factors.length === 0}>
                                            <Plus className="h-4 w-4 mr-2" /> Add
                                        </Button>
                                    </div>
                                    {evaluationFactors.length === 0 ? (
                                        <p className="text-sm text-gray-500">Add factors to simulate a claim context.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {evaluationFactors.map((factor) => (
                                                <div key={factor.id} className="grid grid-cols-2 gap-2">
                                                    <Select
                                                        value={factor.factorCode || undefined}
                                                        onValueChange={(value) => handleEvaluationFactorChange(factor.id, { factorCode: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Factor" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {factors.map((option) => (
                                                                <SelectItem key={option.code} value={option.code}>
                                                                    {option.code}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        value={factor.value}
                                                        onChange={(event) => handleEvaluationFactorChange(factor.id, { value: event.target.value })}
                                                        placeholder="Value"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {evaluationError && <p className="text-sm text-red-600">{evaluationError}</p>}
                                <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={() => void handleEvaluate()} disabled={evaluating}>
                                    {evaluating ? 'Evaluating...' : 'Evaluate rules'}
                                </Button>
                            </div>

                            <div className="rounded-lg border p-4 space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                    <Target className="h-4 w-4" /> Result
                                </div>
                                {evaluationResult ? (
                                    <div className="space-y-3 text-sm text-gray-700">
                                        <div className={cn('rounded-lg border p-3', evaluationResult.eligible ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50')}>
                                            <p className="font-semibold flex items-center gap-2">
                                                {evaluationResult.eligible ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 text-rose-600" />
                                                )}
                                                {evaluationResult.eligible ? 'Eligible' : 'Not eligible'}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">{evaluationResult.reasons.join(', ') || 'No reasons returned.'}</p>
                                        </div>
                                        <p>
                                            <span className="font-semibold">Max quantity:</span>{' '}
                                            {evaluationResult.maxAllowedQuantity !== null && evaluationResult.maxAllowedQuantity !== undefined
                                                ? numberFormatter.format(evaluationResult.maxAllowedQuantity)
                                                : '—'}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Price adjustment:</span>{' '}
                                            {evaluationResult.priceAdjustmentValue !== null && evaluationResult.priceAdjustmentValue !== undefined
                                                ? numberFormatter.format(evaluationResult.priceAdjustmentValue)
                                                : '—'}
                                        </p>
                                        <div>
                                            <p className="font-semibold">Applied rules</p>
                                            <ul className="text-xs text-gray-600 list-disc list-inside">
                                                {evaluationResult.appliedRules.length === 0 && <li>No rules matched.</li>}
                                                {evaluationResult.appliedRules.map((rule, index) => (
                                                    <li key={`${rule}-${index}`}>{rule}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Run a simulation to preview how rules respond to context.</p>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="factors" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="rounded-lg border p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                    <ShieldCheck className="h-4 w-4" /> Available factors
                                </div>
                                {loadingFactors ? (
                                    <p className="text-sm text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading factors...
                                    </p>
                                ) : factors.length === 0 ? (
                                    <p className="text-sm text-gray-500">No factors defined yet.</p>
                                ) : (
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        {factors.map((factor) => (
                                            <li key={factor.code} className="rounded border px-3 py-2">
                                                <p className="font-semibold">{factor.code}</p>
                                                <p className="text-xs text-gray-500">{factor.description}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {factorError && <p className="text-sm text-red-600">{factorError}</p>}
                                <Button variant="outline" size="sm" onClick={() => void loadFactors()}>
                                    <RefreshCcw className="h-4 w-4 mr-2" /> Reload
                                </Button>
                            </div>

                            <div className="rounded-lg border p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                    <Sparkles className="h-4 w-4" /> Create factor
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="factor-code">Code</Label>
                                    <Input
                                        id="factor-code"
                                        value={factorForm.code}
                                        onChange={(event) => setFactorForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="factor-description">Description</Label>
                                    <Textarea
                                        id="factor-description"
                                        rows={3}
                                        value={factorForm.description}
                                        onChange={(event) => setFactorForm((prev) => ({ ...prev, description: event.target.value }))}
                                    />
                                </div>
                                <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={() => void handleCreateFactor()} disabled={savingFactor}>
                                    {savingFactor ? 'Saving...' : 'Save factor'}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
