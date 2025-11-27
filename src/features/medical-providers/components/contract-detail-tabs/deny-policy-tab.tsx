'use client'

import { useState } from 'react'
import { Save, Loader2, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ProviderContract, ProviderContractUpdatePayload } from '@/types/provider-contract'
import { updateProviderContract } from '@/lib/api/provider-contracts'

interface DenyPolicyTabProps {
    contract: ProviderContract
    onUpdate: () => Promise<void>
}

export function DenyPolicyTab({ contract, onUpdate }: DenyPolicyTabProps) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [jsonText, setJsonText] = useState(
        contract.denyPolicy ? JSON.stringify(contract.denyPolicy, null, 2) : '{}'
    )
    const [jsonError, setJsonError] = useState<string | null>(null)

    const validateJson = (text: string): boolean => {
        try {
            JSON.parse(text)
            setJsonError(null)
            return true
        } catch (err) {
            setJsonError(err instanceof Error ? err.message : 'Invalid JSON')
            return false
        }
    }

    const handleSave = async () => {
        if (!validateJson(jsonText)) {
            setError('Please fix JSON syntax errors before saving')
            return
        }

        setSaving(true)
        setError(null)
        setSuccess(false)

        try {
            const parsed = JSON.parse(jsonText)
            const payload: ProviderContractUpdatePayload = {
                denyPolicy: parsed,
            }

            await updateProviderContract(contract.id, payload)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
            await onUpdate()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save deny policy')
        } finally {
            setSaving(false)
        }
    }

    const handleTemplate = (template: string) => {
        setJsonText(template)
        setJsonError(null)
    }

    const templates = {
        basic: JSON.stringify(
            {
                denyReasons: [],
                autoDeny: false,
            },
            null,
            2
        ),
        withRules: JSON.stringify(
            {
                denyReasons: ['INVALID_PROVIDER', 'OUT_OF_NETWORK'],
                autoDeny: true,
                rules: [
                    {
                        condition: 'amount > 10000',
                        action: 'REQUIRE_APPROVAL',
                    },
                ],
            },
            null,
            2
        ),
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Deny Policy</h2>
                    <p className="text-sm text-gray-600">Configure denial policies as JSON</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleTemplate(templates.basic)} disabled={saving}>
                        Basic Template
                    </Button>
                    <Button variant="outline" onClick={() => handleTemplate(templates.withRules)} disabled={saving}>
                        With Rules Template
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !!jsonError} className="bg-tpa-primary hover:bg-tpa-accent">
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Policy
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    Deny policy saved successfully!
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCode className="h-5 w-5" />
                        Policy JSON
                    </CardTitle>
                    <CardDescription>Edit the deny policy JSON configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="denyPolicy">Deny Policy JSON</Label>
                        <Textarea
                            id="denyPolicy"
                            value={jsonText}
                            onChange={(e) => {
                                setJsonText(e.target.value)
                                validateJson(e.target.value)
                            }}
                            className="font-mono text-sm min-h-[400px]"
                            placeholder='{\n  "denyReasons": [],\n  "autoDeny": false\n}'
                            disabled={saving}
                        />
                        {jsonError && (
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                JSON Error: {jsonError}
                            </div>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">
                        <strong>Tip:</strong> Use the template buttons above to get started, or edit the JSON directly.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

