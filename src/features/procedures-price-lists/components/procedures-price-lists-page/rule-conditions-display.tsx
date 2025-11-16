import React from 'react'
import {formatConditionValue, getConditionColorClass, RuleJsonCondition} from './helpers'

interface RuleConditionsDisplayProps {
    ruleJson: string
}

export function RuleConditionsDisplay({ruleJson}: RuleConditionsDisplayProps) {
    let conditions: RuleJsonCondition[] = []
    try {
        const parsed = JSON.parse(ruleJson)
        conditions = Array.isArray(parsed?.conditions) ? parsed.conditions : []
    } catch {
        return <span className="text-red-500 text-xs">Invalid JSON</span>
    }

    const factorLabels: Record<string, string> = {
        gender: 'Gender',
        patient_age: 'Age',
        visit_time: 'Visit',
        specialty_id: 'Specialty',
        provider_type: 'Provider',
        insurance_degree: 'Insurance',
        doctor_experience_years: 'Dr. Experience',
    }

    const formatCondition = (condition: RuleJsonCondition) => {
        const factor = factorLabels[condition.factor] || condition.factor
        const operator = condition.operator === '=' ? ':'
            : condition.operator === 'BETWEEN' ? ':'
                : condition.operator === 'IN' ? ' in'
                    : condition.operator === 'MIN' ? ' ≥'
                        : condition.operator === 'MAX' ? ' ≤'
                            : ` ${condition.operator}`
        return {
            factor,
            operator,
            value: formatConditionValue(condition.factor, condition.value),
        }
    }

    return (
        <div className="flex flex-wrap gap-1">
            {conditions.map((condition, idx) => {
                const {factor, operator, value} = formatCondition(condition)
                const colorClass = getConditionColorClass(condition.factor)
                return (
                    <span
                        key={idx}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
                        title={`${factor} ${condition.operator} ${value}`}
                    >
                        {factor}{operator} <span className="font-bold ml-0.5">{value}</span>
                    </span>
                )
            })}
            {conditions.length === 0 && (
                <span className="text-gray-400 text-xs italic">No conditions</span>
            )}
        </div>
    )
}
