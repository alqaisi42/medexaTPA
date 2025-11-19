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
    computeDosageRecommendation,
    createDosageRule as createDosageRuleApi,
    deactivateDosageRule as deactivateDosageRuleApi,
    deleteDosageRule as deleteDosageRuleApi,
    fetchDosageRulesByPack,
    updateDosageRule as updateDosageRuleApi,
} from '@/lib/api/drug-dosage-rules'
import { evaluateDrugDecision } from '@/lib/api/drug-decision'
import {
    DosageRecommendationResponse,
    DosageRule,
    DrugPack,
    DrugRule,
    DrugRuleCondition,
    DrugRuleEvaluationResponse,
    DrugRuleFactor,
    DrugRuleOperator,
    DrugRuleType,
    DrugDecisionEvaluationResponse,
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

interface FrequencyDraft {
    id: string
    frequencyCode: string
    timesPerDay: string
    intervalHours: string
    timingNotes: string
    specialInstructions: string
}

interface DosageRuleFormState {
    ruleName: string
    dosageAmount: string
    dosageUnit: string
    notes: string
    priority: string
    validFrom: string
    validTo: string
}

interface DecisionRequestState {
    priceListId: string
    requestedQuantity: string
    requestedDate: string
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

function buildFrequencyDraft(): FrequencyDraft {
    return {
        id: generateDraftId(),
        frequencyCode: '',
        timesPerDay: '',
        intervalHours: '',
        timingNotes: '',
        specialInstructions: '',
    }
}

function buildInitialDosageForm(): DosageRuleFormState {
    return {
        ruleName: '',
        dosageAmount: '',
        dosageUnit: '',
        notes: '',
        priority: '',
        validFrom: '',
        validTo: '',
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

function mapFrequencyToDraft(frequency: DosageRule['frequencies'][number]): FrequencyDraft {
    return {
        id: generateDraftId(),
        frequencyCode: frequency.frequencyCode,
        timesPerDay: frequency.timesPerDay !== null && frequency.timesPerDay !== undefined ? String(frequency.timesPerDay) : '',
        intervalHours:
            frequency.intervalHours !== null && frequency.intervalHours !== undefined
                ? String(frequency.intervalHours)
                : '',
        timingNotes: frequency.timingNotes ?? '',
        specialInstructions: frequency.specialInstructions ?? '',
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
    const [activeTab, setActiveTab] = useState<'rules' | 'builder' | 'evaluate' | 'factors' | 'dosage'>('rules')
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

    const [dosageRules, setDosageRules] = useState<DosageRule[]>([])
    const [loadingDosageRules, setLoadingDosageRules] = useState(false)
    const [dosageRulesError, setDosageRulesError] = useState<string | null>(null)
    const [showDosageActiveOnly, setShowDosageActiveOnly] = useState(true)
    const [dosageForm, setDosageForm] = useState<DosageRuleFormState>(buildInitialDosageForm())
    const [dosageConditions, setDosageConditions] = useState<ConditionDraft[]>([])
    const [dosageFrequencies, setDosageFrequencies] = useState<FrequencyDraft[]>([])
    const [dosageFormError, setDosageFormError] = useState<string | null>(null)
    const [savingDosageRule, setSavingDosageRule] = useState(false)
    const [editingDosageRule, setEditingDosageRule] = useState<DosageRule | null>(null)
    const [deletingDosageRuleId, setDeletingDosageRuleId] = useState<number | null>(null)
    const [deactivatingDosageRuleId, setDeactivatingDosageRuleId] = useState<number | null>(null)

    const [dosageRecommendationDate, setDosageRecommendationDate] = useState(() => new Date().toISOString().slice(0, 10))
    const [dosageScenarioFactors, setDosageScenarioFactors] = useState<EvaluationFactorDraft[]>([])
    const [dosageRecommendationResult, setDosageRecommendationResult] = useState<DosageRecommendationResponse | null>(null)
    const [recommendingDosage, setRecommendingDosage] = useState(false)
    const [dosageRecommendationError, setDosageRecommendationError] = useState<string | null>(null)

    const [decisionRequest, setDecisionRequest] = useState<DecisionRequestState>(() => ({
        priceListId: '',
        requestedQuantity: '',
        requestedDate: new Date().toISOString().slice(0, 10),
    }))
    const [decisionFactors, setDecisionFactors] = useState<EvaluationFactorDraft[]>([])
    const [decisionResult, setDecisionResult] = useState<DrugDecisionEvaluationResponse | null>(null)
    const [decisionError, setDecisionError] = useState<string | null>(null)
    const [evaluatingDecision, setEvaluatingDecision] = useState(false)

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

    const loadDosageRules = useCallback(async () => {
        if (!pack) return
        setLoadingDosageRules(true)
        setDosageRulesError(null)
        try {
            const data = await fetchDosageRulesByPack(pack.id)
            setDosageRules(data)
        } catch (error) {
            console.error(error)
            setDosageRules([])
            setDosageRulesError(error instanceof Error ? error.message : 'Unable to load dosage rules')
        } finally {
            setLoadingDosageRules(false)
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
        void loadDosageRules()
        setRuleForm(buildInitialRuleForm())
        setConditions([])
        setEditingRule(null)
        setRuleFormError(null)
        setEvaluationResult(null)
        setEvaluationError(null)
        setEvaluationFactors([buildEvaluationFactorDraft([])])
        setDosageForm(buildInitialDosageForm())
        setDosageConditions([])
        setDosageFrequencies([])
        setEditingDosageRule(null)
        setDosageFormError(null)
        setDosageRecommendationResult(null)
        setDosageRecommendationError(null)
        setDosageScenarioFactors([buildEvaluationFactorDraft([])])
        setDecisionFactors([buildEvaluationFactorDraft([])])
        setDecisionResult(null)
        setDecisionError(null)
        setDecisionRequest({ priceListId: '', requestedQuantity: '', requestedDate: new Date().toISOString().slice(0, 10) })
        setDosageRecommendationDate(new Date().toISOString().slice(0, 10))
        setActiveTab('rules')
    }, [pack, loadRules, loadFactors, loadDosageRules])

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
        if (dosageConditions.length === 0 && factors.length > 0) {
            setDosageConditions([buildEmptyCondition(factors)])
        }
        if (dosageFrequencies.length === 0) {
            setDosageFrequencies([buildFrequencyDraft()])
        }
        if (dosageScenarioFactors.length === 0 && factors.length > 0) {
            setDosageScenarioFactors([buildEvaluationFactorDraft(factors)])
        }
        if (decisionFactors.length === 0 && factors.length > 0) {
            setDecisionFactors([buildEvaluationFactorDraft(factors)])
        }
        if (factors.length > 0 && dosageScenarioFactors.length === 1 && !dosageScenarioFactors[0]?.factorCode) {
            setDosageScenarioFactors([buildEvaluationFactorDraft(factors)])
        }
        if (factors.length > 0 && decisionFactors.length === 1 && !decisionFactors[0]?.factorCode) {
            setDecisionFactors([buildEvaluationFactorDraft(factors)])
        }
    }, [
        conditions.length,
        evaluationFactors,
        factors,
        dosageConditions.length,
        dosageFrequencies.length,
        dosageScenarioFactors,
        decisionFactors,
    ])

    const visibleRules = useMemo(() => {
        return showActiveOnly ? rules.filter((rule) => rule.isActive) : rules
    }, [rules, showActiveOnly])

    const visibleDosageRules = useMemo(() => {
        return showDosageActiveOnly ? dosageRules.filter((rule) => rule.isActive) : dosageRules
    }, [dosageRules, showDosageActiveOnly])

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

    const handleDosageFormChange = (field: keyof DosageRuleFormState, value: string) => {
        setDosageForm((prev) => ({ ...prev, [field]: value }))
        setDosageFormError(null)
    }

    const handleDosageConditionChange = (id: string, updates: Partial<ConditionDraft>) => {
        setDosageConditions((prev) => prev.map((condition) => (condition.id === id ? { ...condition, ...updates } : condition)))
        setDosageFormError(null)
    }

    const handleAddDosageCondition = () => {
        if (factors.length === 0) {
            setDosageFormError('Define factors before adding conditions.')
            return
        }
        setDosageConditions((prev) => [...prev, buildEmptyCondition(factors)])
    }

    const handleRemoveDosageCondition = (id: string) => {
        setDosageConditions((prev) => (prev.length === 1 ? prev : prev.filter((condition) => condition.id !== id)))
    }

    const handleFrequencyChange = (id: string, updates: Partial<FrequencyDraft>) => {
        setDosageFrequencies((prev) => prev.map((frequency) => (frequency.id === id ? { ...frequency, ...updates } : frequency)))
        setDosageFormError(null)
    }

    const handleAddFrequency = () => {
        setDosageFrequencies((prev) => [...prev, buildFrequencyDraft()])
    }

    const handleRemoveFrequency = (id: string) => {
        setDosageFrequencies((prev) => (prev.length === 1 ? prev : prev.filter((frequency) => frequency.id !== id)))
    }

    const resetDosageForm = () => {
        setDosageForm(buildInitialDosageForm())
        setDosageConditions(factors.length > 0 ? [buildEmptyCondition(factors)] : [])
        setDosageFrequencies([buildFrequencyDraft()])
        setEditingDosageRule(null)
        setDosageFormError(null)
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

    const buildFrequencyPayload = (draft: FrequencyDraft) => {
        return {
            frequencyCode: draft.frequencyCode.trim(),
            timesPerDay: draft.timesPerDay !== '' ? Number(draft.timesPerDay) : null,
            intervalHours: draft.intervalHours !== '' ? Number(draft.intervalHours) : null,
            timingNotes: draft.timingNotes.trim() || null,
            specialInstructions: draft.specialInstructions.trim() || null,
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

    const handleSaveDosageRule = async () => {
        if (!pack) return
        if (!dosageForm.ruleName.trim()) {
            setDosageFormError('Rule name is required.')
            return
        }
        if (!dosageForm.dosageAmount.trim()) {
            setDosageFormError('Dosage amount is required.')
            return
        }
        if (!dosageForm.dosageUnit.trim()) {
            setDosageFormError('Dosage unit is required.')
            return
        }
        if (dosageConditions.length === 0) {
            setDosageFormError('Add at least one condition to this rule.')
            return
        }
        if (dosageConditions.some((condition) => !condition.factorCode)) {
            setDosageFormError('Each condition must target a factor.')
            return
        }
        if (dosageFrequencies.length === 0 || dosageFrequencies.some((frequency) => !frequency.frequencyCode.trim())) {
            setDosageFormError('Provide at least one frequency with a code.')
            return
        }

        const payload = {
            drugPackId: pack.id,
            ruleName: dosageForm.ruleName.trim(),
            dosageAmount: Number(dosageForm.dosageAmount) || 0,
            dosageUnit: dosageForm.dosageUnit.trim(),
            notes: dosageForm.notes.trim() || null,
            priority: Number(dosageForm.priority) || 0,
            validFrom: dosageForm.validFrom || null,
            validTo: dosageForm.validTo || null,
            conditions: dosageConditions.map((condition) => buildConditionPayload(condition)),
            frequencies: dosageFrequencies.map((frequency) => buildFrequencyPayload(frequency)),
        }

        setSavingDosageRule(true)
        setDosageFormError(null)
        try {
            if (editingDosageRule) {
                await updateDosageRuleApi(editingDosageRule.id, payload)
            } else {
                await createDosageRuleApi(payload)
            }
            await loadDosageRules()
            resetDosageForm()
            setActiveTab('dosage')
        } catch (error) {
            console.error(error)
            setDosageFormError(error instanceof Error ? error.message : 'Unable to save dosage rule')
        } finally {
            setSavingDosageRule(false)
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

    const handleEditDosageRule = (rule: DosageRule) => {
        setActiveTab('dosage')
        setEditingDosageRule(rule)
        setDosageForm({
            ruleName: rule.ruleName,
            dosageAmount: String(rule.dosageAmount ?? ''),
            dosageUnit: rule.dosageUnit ?? '',
            notes: rule.notes ?? '',
            priority: String(rule.priority ?? ''),
            validFrom: rule.validFrom ?? '',
            validTo: rule.validTo ?? '',
        })
        setDosageConditions(
            rule.conditions.length > 0 ? rule.conditions.map((condition) => mapConditionToDraft(condition)) : [],
        )
        setDosageFrequencies(
            rule.frequencies.length > 0 ? rule.frequencies.map((frequency) => mapFrequencyToDraft(frequency)) : [],
        )
        setDosageFormError(null)
    }

    const handleDeleteDosageRule = async (rule: DosageRule) => {
        setDeletingDosageRuleId(rule.id)
        try {
            await deleteDosageRuleApi(rule.id)
            await loadDosageRules()
        } catch (error) {
            console.error(error)
            setDosageRulesError(error instanceof Error ? error.message : 'Unable to delete dosage rule')
        } finally {
            setDeletingDosageRuleId(null)
        }
    }

    const handleDeactivateDosageRule = async (rule: DosageRule) => {
        setDeactivatingDosageRuleId(rule.id)
        try {
            await deactivateDosageRuleApi(rule.id)
            await loadDosageRules()
        } catch (error) {
            console.error(error)
            setDosageRulesError(error instanceof Error ? error.message : 'Unable to deactivate dosage rule')
        } finally {
            setDeactivatingDosageRuleId(null)
        }
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

    const handleRecommendDosage = async () => {
        if (!pack) return
        if (!dosageRecommendationDate) {
            setDosageRecommendationError('Recommendation date is required.')
            return
        }
        const payloadFactors: Record<string, string> = {}
        dosageScenarioFactors.forEach((factor) => {
            if (factor.factorCode && factor.value.trim()) {
                payloadFactors[factor.factorCode] = factor.value.trim()
            }
        })
        setRecommendingDosage(true)
        setDosageRecommendationError(null)
        setDosageRecommendationResult(null)
        try {
            const result = await computeDosageRecommendation(pack.id, {
                date: dosageRecommendationDate,
                factors: payloadFactors,
            })
            setDosageRecommendationResult(result)
        } catch (error) {
            console.error(error)
            setDosageRecommendationError(error instanceof Error ? error.message : 'Unable to compute dosage recommendation')
        } finally {
            setRecommendingDosage(false)
        }
    }

    const handleAddEvaluationFactor = () => {
        if (factors.length === 0) {
            setEvaluationError('Create rule factors before evaluating scenarios.')
            return
        }
        setEvaluationFactors((prev) => [...prev, buildEvaluationFactorDraft(factors)])
    }

    const handleAddDosageScenarioFactor = () => {
        if (factors.length === 0) {
            setDosageRecommendationError('Create factors before simulating dosage scenarios.')
            return
        }
        setDosageScenarioFactors((prev) => [...prev, buildEvaluationFactorDraft(factors)])
    }

    const handleAddDecisionFactor = () => {
        if (factors.length === 0) {
            setDecisionError('Create rule factors before running the decision engine.')
            return
        }
        setDecisionFactors((prev) => [...prev, buildEvaluationFactorDraft(factors)])
    }

    const handleEvaluationFactorChange = (id: string, updates: Partial<EvaluationFactorDraft>) => {
        setEvaluationFactors((prev) => prev.map((factor) => (factor.id === id ? { ...factor, ...updates } : factor)))
        setEvaluationError(null)
    }

    const handleDosageScenarioFactorChange = (id: string, updates: Partial<EvaluationFactorDraft>) => {
        setDosageScenarioFactors((prev) => prev.map((factor) => (factor.id === id ? { ...factor, ...updates } : factor)))
        setDosageRecommendationError(null)
    }

    const handleDecisionFactorChange = (id: string, updates: Partial<EvaluationFactorDraft>) => {
        setDecisionFactors((prev) => prev.map((factor) => (factor.id === id ? { ...factor, ...updates } : factor)))
        setDecisionError(null)
    }

    const handleDecisionRequestChange = (field: keyof DecisionRequestState, value: string) => {
        setDecisionRequest((prev) => ({ ...prev, [field]: value }))
        setDecisionError(null)
    }

    const handleEvaluateDecision = async () => {
        if (!pack) return
        if (!decisionRequest.priceListId.trim() || !decisionRequest.requestedQuantity.trim()) {
            setDecisionError('Price list and requested quantity are required.')
            return
        }
        if (!decisionRequest.requestedDate) {
            setDecisionError('Requested date is required.')
            return
        }
        const factorPayload: Record<string, string> = {}
        decisionFactors.forEach((factor) => {
            if (factor.factorCode && factor.value.trim()) {
                factorPayload[factor.factorCode] = factor.value.trim()
            }
        })
        setEvaluatingDecision(true)
        setDecisionError(null)
        setDecisionResult(null)
        try {
            const result = await evaluateDrugDecision({
                drugPackId: pack.id,
                priceListId: Number(decisionRequest.priceListId),
                requestedQuantity: Number(decisionRequest.requestedQuantity),
                factors: factorPayload,
                requestedDate: decisionRequest.requestedDate,
            })
            setDecisionResult(result)
        } catch (error) {
            console.error(error)
            setDecisionError(error instanceof Error ? error.message : 'Unable to evaluate drug decision')
        } finally {
            setEvaluatingDecision(false)
        }
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
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="rules">Rules</TabsTrigger>
                        <TabsTrigger value="builder">Builder</TabsTrigger>
                        <TabsTrigger value="evaluate">Evaluate</TabsTrigger>
                        <TabsTrigger value="factors">Factors</TabsTrigger>
                        <TabsTrigger value="dosage">Dosage rules</TabsTrigger>
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

                    <TabsContent value="dosage" className="space-y-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-4">
                                <div className="rounded-lg border p-4 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Configured dosage rules</p>
                                            <p className="text-xs text-gray-600">Build recommendations for adults, pediatrics, renal dosing, and more.</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Switch
                                                    id="dosage-active-only"
                                                    checked={showDosageActiveOnly}
                                                    onCheckedChange={(checked) => setShowDosageActiveOnly(checked)}
                                                />
                                                <Label htmlFor="dosage-active-only" className="text-xs text-gray-600">
                                                    Active only
                                                </Label>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={resetDosageForm}>
                                                <Plus className="h-4 w-4 mr-2" /> New rule
                                            </Button>
                                        </div>
                                    </div>
                                    {dosageRulesError && <p className="text-sm text-red-600">{dosageRulesError}</p>}
                                    {loadingDosageRules ? (
                                        <p className="text-sm text-gray-500">
                                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading dosage rules...
                                        </p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Rule</TableHead>
                                                        <TableHead>Dosage</TableHead>
                                                        <TableHead className="text-center">Frequencies</TableHead>
                                                        <TableHead className="text-center">Status</TableHead>
                                                        <TableHead className="text-center">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {visibleDosageRules.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                                                                {dosageRules.length === 0
                                                                    ? 'No dosage rules yet. Use the builder to create the first one.'
                                                                    : 'No rules match the current filter.'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        visibleDosageRules.map((rule) => (
                                                            <TableRow key={rule.id}>
                                                                <TableCell>
                                                                    <div className="font-semibold text-gray-900">{rule.ruleName}</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Priority #{rule.priority ?? '—'} • Valid {rule.validFrom ? formatDate(rule.validFrom) : '—'} →{' '}
                                                                        {rule.validTo ? formatDate(rule.validTo) : 'Open-ended'}
                                                                    </div>
                                                                    {rule.notes && <p className="text-xs text-gray-600 mt-1">{rule.notes}</p>}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <p className="font-medium text-sm">
                                                                        {rule.dosageAmount} {rule.dosageUnit}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">{rule.conditions.length} condition(s)</p>
                                                                </TableCell>
                                                                <TableCell className="text-center text-sm font-semibold">
                                                                    {rule.frequencies.length}
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <span
                                                                        className={cn(
                                                                            'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                                                                            rule.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700',
                                                                        )}
                                                                    >
                                                                        {rule.isActive ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <Button variant="outline" size="icon" onClick={() => handleEditDosageRule(rule)}>
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            disabled={!rule.isActive || deactivatingDosageRuleId === rule.id}
                                                                            onClick={() => void handleDeactivateDosageRule(rule)}
                                                                            title="Deactivate rule"
                                                                        >
                                                                            {deactivatingDosageRuleId === rule.id ? (
                                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <ShieldCheck className="h-4 w-4" />
                                                                            )}
                                                                        </Button>
                                                                        <Button
                                                                            variant="destructive"
                                                                            size="icon"
                                                                            disabled={deletingDosageRuleId === rule.id}
                                                                            onClick={() => void handleDeleteDosageRule(rule)}
                                                                        >
                                                                            {deletingDosageRuleId === rule.id ? (
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
                                    )}
                                </div>

                                <div className="rounded-lg border p-4 space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                        <Sparkles className="h-4 w-4" /> Dosage recommendation sandbox
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="dosage-date">Requested date</Label>
                                            <Input
                                                id="dosage-date"
                                                type="date"
                                                value={dosageRecommendationDate}
                                                onChange={(event) => setDosageRecommendationDate(event.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-2 text-sm text-gray-500 flex items-end">
                                            Provide scenario factors to see which rule wins and what schedule is suggested.
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold">Scenario factors</Label>
                                            <Button size="sm" variant="outline" onClick={handleAddDosageScenarioFactor}>
                                                <Plus className="h-4 w-4 mr-2" /> Add factor
                                            </Button>
                                        </div>
                                        {dosageScenarioFactors.map((factor) => (
                                            <div key={factor.id} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <Select
                                                    value={factor.factorCode || undefined}
                                                    onValueChange={(value) => handleDosageScenarioFactorChange(factor.id, { factorCode: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Factor" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {factors.map((item) => (
                                                            <SelectItem key={item.code} value={item.code}>
                                                                {item.code} — {item.description}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder="Value"
                                                    value={factor.value}
                                                    onChange={(event) => handleDosageScenarioFactorChange(factor.id, { value: event.target.value })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {dosageRecommendationError && (
                                        <p className="text-sm text-red-600">{dosageRecommendationError}</p>
                                    )}
                                    <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={() => void handleRecommendDosage()} disabled={recommendingDosage}>
                                        {recommendingDosage ? 'Calculating...' : 'Compute recommendation'}
                                    </Button>
                                    {dosageRecommendationResult && (
                                        <div className="rounded-lg border bg-slate-50 p-4 space-y-2 text-sm">
                                            <div className="flex items-center gap-2 font-semibold">
                                                {dosageRecommendationResult.foundRule ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                                )}
                                                {dosageRecommendationResult.foundRule ? 'Matching rule' : 'No rule matched'}
                                            </div>
                                            {dosageRecommendationResult.foundRule && (
                                                <>
                                                    <p className="font-semibold text-gray-900">{dosageRecommendationResult.ruleName}</p>
                                                    <p>
                                                        <span className="font-semibold">Dosage:</span>{' '}
                                                        {dosageRecommendationResult.dosageAmount ?? '—'} {dosageRecommendationResult.dosageUnit ?? ''}
                                                    </p>
                                                    {dosageRecommendationResult.notes && (
                                                        <p className="text-xs text-gray-600">{dosageRecommendationResult.notes}</p>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-sm">Frequencies</p>
                                                        <ul className="list-disc list-inside text-xs text-gray-600">
                                                            {dosageRecommendationResult.frequencies.length === 0 && <li>No frequency entries.</li>}
                                                            {dosageRecommendationResult.frequencies.map((frequency, index) => (
                                                                <li key={`${frequency.frequencyCode}-${index}`}>
                                                                    {frequency.frequencyCode} — {frequency.timesPerDay ?? '—'}x/day, every {frequency.intervalHours ?? '—'} h.{' '}
                                                                    {frequency.timingNotes}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </>
                                            )}
                                            {dosageRecommendationResult.reasons.length > 0 && (
                                                <div>
                                                    <p className="font-semibold text-sm">Reasons</p>
                                                    <ul className="list-disc list-inside text-xs text-gray-600">
                                                        {dosageRecommendationResult.reasons.map((reason, index) => (
                                                            <li key={`${reason}-${index}`}>{reason}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border p-4 space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                        <Target className="h-4 w-4" /> Clinical decision engine
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="decision-price-list">Price list</Label>
                                            <Input
                                                id="decision-price-list"
                                                type="number"
                                                min="0"
                                                value={decisionRequest.priceListId}
                                                onChange={(event) => handleDecisionRequestChange('priceListId', event.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="decision-quantity">Requested quantity</Label>
                                            <Input
                                                id="decision-quantity"
                                                type="number"
                                                min="0"
                                                value={decisionRequest.requestedQuantity}
                                                onChange={(event) => handleDecisionRequestChange('requestedQuantity', event.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="decision-date">Requested date</Label>
                                            <Input
                                                id="decision-date"
                                                type="date"
                                                value={decisionRequest.requestedDate}
                                                onChange={(event) => handleDecisionRequestChange('requestedDate', event.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold">Factors</Label>
                                            <Button size="sm" variant="outline" onClick={handleAddDecisionFactor}>
                                                <Plus className="h-4 w-4 mr-2" /> Add factor
                                            </Button>
                                        </div>
                                        {decisionFactors.map((factor) => (
                                            <div key={factor.id} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <Select
                                                    value={factor.factorCode || undefined}
                                                    onValueChange={(value) => handleDecisionFactorChange(factor.id, { factorCode: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Factor" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {factors.map((item) => (
                                                            <SelectItem key={item.code} value={item.code}>
                                                                {item.code} — {item.description}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder="Value"
                                                    value={factor.value}
                                                    onChange={(event) => handleDecisionFactorChange(factor.id, { value: event.target.value })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {decisionError && <p className="text-sm text-red-600">{decisionError}</p>}
                                    <Button variant="outline" onClick={() => void handleEvaluateDecision()} disabled={evaluatingDecision}>
                                        {evaluatingDecision ? 'Evaluating...' : 'Evaluate drug decision'}
                                    </Button>
                                    {decisionResult && (
                                        <div className="rounded-lg border bg-white p-4 space-y-3 text-sm">
                                            <div className="flex items-center gap-2 font-semibold">
                                                {decisionResult.eligible ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                )}
                                                {decisionResult.eligible ? 'Eligible for dispensing' : 'Not eligible'}
                                            </div>
                                            {decisionResult.reasons.length > 0 && (
                                                <div>
                                                    <p className="font-semibold">Reasons</p>
                                                    <ul className="list-disc list-inside text-xs text-gray-600">
                                                        {decisionResult.reasons.map((reason, index) => (
                                                            <li key={`${reason}-${index}`}>{reason}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {decisionResult.pricing && (
                                                <div className="grid gap-1 text-xs text-gray-600">
                                                    <p>
                                                        <span className="font-semibold">Base unit:</span> {decisionResult.pricing.baseUnitPrice ?? '—'}
                                                    </p>
                                                    <p>
                                                        <span className="font-semibold">Final unit:</span> {decisionResult.pricing.finalUnitPrice ?? '—'}
                                                    </p>
                                                    <p>
                                                        <span className="font-semibold">Total (final):</span> {decisionResult.pricing.finalTotalPrice ?? '—'}
                                                    </p>
                                                    <p>
                                                        <span className="font-semibold">Quantity enforced:</span> {decisionResult.pricing.quantityAfterEnforcement ?? '—'} / {decisionResult.pricing.maxAllowedQuantity ?? '—'}
                                                    </p>
                                                </div>
                                            )}
                                            {decisionResult.dosage && (
                                                <div className="space-y-1">
                                                    <p className="font-semibold">Dosage guidance</p>
                                                    <p>
                                                        {decisionResult.dosage.dosageAmount ?? '—'} {decisionResult.dosage.dosageUnit ?? ''} — {decisionResult.dosage.ruleName}
                                                    </p>
                                                </div>
                                            )}
                                            {decisionResult.warnings.length > 0 && (
                                                <div>
                                                    <p className="font-semibold">Warnings</p>
                                                    <ul className="list-disc list-inside text-xs text-amber-600">
                                                        {decisionResult.warnings.map((warning, index) => (
                                                            <li key={`${warning}-${index}`}>{warning}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {decisionResult.clinicalNotes.length > 0 && (
                                                <div>
                                                    <p className="font-semibold">Clinical notes</p>
                                                    <ul className="list-disc list-inside text-xs text-gray-600">
                                                        {decisionResult.clinicalNotes.map((note, index) => (
                                                            <li key={`${note}-${index}`}>{note}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-lg border p-4 space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                        <FlaskConical className="h-4 w-4" /> Dosage rule builder
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="dosage-rule-name">Rule name</Label>
                                            <Input
                                                id="dosage-rule-name"
                                                value={dosageForm.ruleName}
                                                onChange={(event) => handleDosageFormChange('ruleName', event.target.value)}
                                                placeholder="Adult maintenance dose"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dosage-priority">Priority</Label>
                                            <Input
                                                id="dosage-priority"
                                                type="number"
                                                min="0"
                                                value={dosageForm.priority}
                                                onChange={(event) => handleDosageFormChange('priority', event.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dosage-valid-from">Valid from</Label>
                                            <Input
                                                id="dosage-valid-from"
                                                type="date"
                                                value={dosageForm.validFrom}
                                                onChange={(event) => handleDosageFormChange('validFrom', event.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dosage-valid-to">Valid to</Label>
                                            <Input
                                                id="dosage-valid-to"
                                                type="date"
                                                value={dosageForm.validTo}
                                                onChange={(event) => handleDosageFormChange('validTo', event.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dosage-amount">Dosage amount</Label>
                                            <Input
                                                id="dosage-amount"
                                                type="number"
                                                min="0"
                                                value={dosageForm.dosageAmount}
                                                onChange={(event) => handleDosageFormChange('dosageAmount', event.target.value)}
                                                placeholder="e.g. 500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dosage-unit">Dosage unit</Label>
                                            <Input
                                                id="dosage-unit"
                                                value={dosageForm.dosageUnit}
                                                onChange={(event) => handleDosageFormChange('dosageUnit', event.target.value)}
                                                placeholder="mg, ml, units..."
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="dosage-notes">Notes</Label>
                                            <Textarea
                                                id="dosage-notes"
                                                rows={3}
                                                value={dosageForm.notes}
                                                onChange={(event) => handleDosageFormChange('notes', event.target.value)}
                                                placeholder="Administration notes, renal adjustments, etc."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Conditions</p>
                                            <p className="text-xs text-gray-600">Combine multiple criteria using AND logic.</p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={handleAddDosageCondition}>
                                            <Plus className="h-4 w-4 mr-2" /> Add condition
                                        </Button>
                                    </div>
                                    {dosageConditions.length === 0 ? (
                                        <p className="text-sm text-gray-500">No conditions yet.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {dosageConditions.map((condition) => (
                                                <div key={condition.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 rounded-lg border p-3">
                                                    <div className="space-y-2">
                                                        <Label>Factor</Label>
                                                        <Select
                                                            value={condition.factorCode || undefined}
                                                            onValueChange={(value) => handleDosageConditionChange(condition.id, { factorCode: value })}
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
                                                                handleDosageConditionChange(condition.id, { operator: value as DrugRuleOperator })
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
                                                                    onChange={(event) => handleDosageConditionChange(condition.id, { valueFrom: event.target.value })}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>To</Label>
                                                                <Input
                                                                    value={condition.valueTo}
                                                                    onChange={(event) => handleDosageConditionChange(condition.id, { valueTo: event.target.value })}
                                                                />
                                                            </div>
                                                        </>
                                                    ) : condition.operator === 'IN' ? (
                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label>Values</Label>
                                                            <Input
                                                                placeholder="Value1, Value2, Value3"
                                                                value={condition.multiValueInput}
                                                                onChange={(event) => handleDosageConditionChange(condition.id, { multiValueInput: event.target.value })}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label>Value</Label>
                                                            <Input
                                                                value={condition.valueExact}
                                                                onChange={(event) => handleDosageConditionChange(condition.id, { valueExact: event.target.value })}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex items-end justify-end">
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveDosageCondition(condition.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Frequencies</p>
                                            <p className="text-xs text-gray-600">Define how often patients take the dose.</p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={handleAddFrequency}>
                                            <Plus className="h-4 w-4 mr-2" /> Add frequency
                                        </Button>
                                    </div>
                                    {dosageFrequencies.length === 0 ? (
                                        <p className="text-sm text-gray-500">No frequency rows yet.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {dosageFrequencies.map((frequency) => (
                                                <div key={frequency.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-lg border p-3">
                                                    <div className="space-y-2">
                                                        <Label>Code</Label>
                                                        <Input
                                                            value={frequency.frequencyCode}
                                                            onChange={(event) => handleFrequencyChange(frequency.id, { frequencyCode: event.target.value })}
                                                            placeholder="BID / Q8H"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Times / day</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={frequency.timesPerDay}
                                                            onChange={(event) => handleFrequencyChange(frequency.id, { timesPerDay: event.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Interval (h)</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={frequency.intervalHours}
                                                            onChange={(event) => handleFrequencyChange(frequency.id, { intervalHours: event.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label>Timing notes</Label>
                                                        <Input
                                                            value={frequency.timingNotes}
                                                            onChange={(event) => handleFrequencyChange(frequency.id, { timingNotes: event.target.value })}
                                                            placeholder="Before meals, with water..."
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Instructions</Label>
                                                        <Input
                                                            value={frequency.specialInstructions}
                                                            onChange={(event) => handleFrequencyChange(frequency.id, { specialInstructions: event.target.value })}
                                                            placeholder="Hold if BP < 90"
                                                        />
                                                    </div>
                                                    <div className="flex items-end justify-end md:col-span-6">
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveFrequency(frequency.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {dosageFormError && <p className="text-sm text-red-600">{dosageFormError}</p>}

                                <div className="flex flex-wrap justify-end gap-3">
                                    <Button variant="outline" onClick={resetDosageForm} disabled={savingDosageRule}>
                                        Reset form
                                    </Button>
                                    <Button className="bg-tpa-primary hover:bg-tpa-accent" onClick={() => void handleSaveDosageRule()} disabled={savingDosageRule}>
                                        {savingDosageRule ? 'Saving...' : editingDosageRule ? 'Update dosage rule' : 'Save dosage rule'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
