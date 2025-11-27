'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, User, Users, Edit2, Eye, AlertCircle, Crown, Baby, Heart, UserCircle, Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Subscriber } from '@/types/subscriber'
import { FamilyTreeResponse, FamilyTreeMember } from '@/types/subscriber'
import { fetchFamilyTree } from '@/lib/api/subscribers'
import { cn } from '@/lib/utils'

interface FamilyTreeTabProps {
    subscriber: Subscriber
    onUpdate?: () => void
}

function formatDate(date: FamilyTreeMember['dateOfBirth']): string {
    if (!date) return '-'
    if (Array.isArray(date)) {
        return `${date[2]}/${date[1]}/${date[0]}`
    }
    if (typeof date === 'string') {
        return new Date(date).toLocaleDateString()
    }
    return '-'
}

function calculateAge(dateOfBirth: FamilyTreeMember['dateOfBirth']): number | null {
    if (!dateOfBirth) return null
    let birthDate: Date
    
    if (Array.isArray(dateOfBirth)) {
        birthDate = new Date(dateOfBirth[0], dateOfBirth[1] - 1, dateOfBirth[2])
    } else if (typeof dateOfBirth === 'string') {
        birthDate = new Date(dateOfBirth)
    } else {
        return null
    }
    
    if (isNaN(birthDate.getTime())) return null
    
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }
    
    return age
}

function getGenderIcon(gender: string) {
    switch (gender?.toUpperCase()) {
        case 'M':
            return UserCircle
        case 'F':
            return Heart
        default:
            return User
    }
}

function getRelationTypeIcon(relationType: string | null) {
    if (!relationType) return User
    
    switch (relationType.toUpperCase()) {
        case 'SPOUSE':
            return Heart
        case 'CHILD':
            return Baby
        case 'PARENT':
            return UserCircle
        case 'SIBLING':
            return Users
        default:
            return User
    }
}

export function FamilyTreeTab({ subscriber, onUpdate }: FamilyTreeTabProps) {
    const router = useRouter()
    const [familyTree, setFamilyTree] = useState<FamilyTreeResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handlePrint = () => {
        window.print()
    }

    const loadFamilyTree = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchFamilyTree(subscriber.id)
            setFamilyTree(data)
        } catch (err) {
            console.error('Failed to load family tree', err)
            setError(err instanceof Error ? err.message : 'Unable to load family tree')
        } finally {
            setLoading(false)
        }
    }, [subscriber.id])

    useEffect(() => {
        void loadFamilyTree()
    }, [loadFamilyTree])

    const handleViewMember = (memberId: number) => {
        router.push(`/subscribers/${memberId}`)
    }

    const handleEditMember = (memberId: number) => {
        router.push(`/subscribers/${memberId}`)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                        <p className="text-lg font-medium text-gray-900 mb-2">Error Loading Family Tree</p>
                        <p className="text-sm text-gray-500 mb-4">{error}</p>
                        <Button onClick={() => void loadFamilyTree()} variant="outline">
                            <Loader2 className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!familyTree) {
        return null
    }

    const HofIcon = Crown
    const allMembers = [familyTree.hof, ...familyTree.dependents]

    const totalMembers = 1 + familyTree.dependents.length
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })
    const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    })

    return (
        <div className="space-y-6">
            {/* Action Buttons - Hidden on print */}
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Family Tree Report</h2>
                    <p className="text-sm text-gray-600">Total Family Members: {totalMembers}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print/Export PDF Report
                    </Button>
                    <Button variant="outline" onClick={() => void loadFamilyTree()}>
                        <Loader2 className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Report Container - Formal TPA Report Layout */}
            <div className="bg-white border border-gray-300 print:border-0">
                {/* Official Report Header - Visible on Print */}
                <div className="hidden print:block border-b-4 border-gray-800 pb-4 mb-6">
                    <div className="text-center mb-4">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">FAMILY TREE REPORT</h1>
                        <h2 className="text-xl font-semibold text-gray-700">Third Party Administrator (TPA) Document</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm border-t border-b border-gray-400 py-3 mt-4">
                        <div>
                            <span className="font-semibold">Report Date:</span> {currentDate}
                        </div>
                        <div>
                            <span className="font-semibold">Report Time:</span> {currentTime}
                        </div>
                        <div>
                            <span className="font-semibold">Total Family Members:</span> {totalMembers}
                        </div>
                        <div>
                            <span className="font-semibold">HOF ID:</span> {familyTree.hof.id}
                        </div>
                    </div>
                </div>

                {/* Head of Family Section - Formal Format */}
                <div className="border-b-4 border-gray-800 mb-6 pb-6 print:mb-4 print:pb-4">
                    <div className="hidden print:block mb-4">
                        <h3 className="text-2xl font-bold text-gray-900 uppercase border-b-2 border-gray-600 pb-2">Section 1: Head of Family</h3>
                    </div>
                    <Card className="border-2 border-blue-200 bg-blue-50/50 print:border print:border-gray-400 print:bg-white print:shadow-none">
                        <CardHeader className="print:pb-2 print:pt-0">
                            <CardTitle className="text-lg flex items-center gap-2 print:text-base print:font-bold">
                                <HofIcon className="h-5 w-5 text-blue-600 print:hidden" />
                                Head of Family (HOF)
                                <span className="ml-auto px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full print:bg-gray-800 print:text-white print:text-xs">
                                    PRIMARY MEMBER
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-white rounded-lg p-6 border-2 border-blue-300 shadow-sm print:border print:border-gray-400 print:p-4 print:shadow-none">
                                <div className="flex items-start justify-between print:block">
                                    <div className="flex-1">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:mb-3">
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900 mb-1 print:text-base">{familyTree.hof.fullNameEn}</h4>
                                                {familyTree.hof.fullNameAr && (
                                                    <p className="text-sm text-gray-600 print:text-xs" dir="rtl">{familyTree.hof.fullNameAr}</p>
                                                )}
                                            </div>
                                            <div className="print:hidden">
                                                {(() => {
                                                    const Icon = getGenderIcon(familyTree.hof.gender)
                                                    return <Icon className="h-8 w-8 text-blue-600" />
                                                })()}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm print:grid-cols-4 print:gap-3 print:text-xs border-t border-gray-300 pt-4">
                                            <div className="border-l-2 border-blue-400 pl-3 print:border-l-0 print:pl-0 print:border-b print:border-gray-400 print:pb-1">
                                                <span className="text-gray-500 block mb-1 print:text-gray-900 print:font-bold uppercase text-xs">Subscriber ID</span>
                                                <p className="font-mono font-bold text-gray-900 text-base print:text-sm">{familyTree.hof.id}</p>
                                            </div>
                                            <div className="border-l-2 border-blue-400 pl-3 print:border-l-0 print:pl-0 print:border-b print:border-gray-400 print:pb-1">
                                                <span className="text-gray-500 block mb-1 print:text-gray-900 print:font-bold uppercase text-xs">National ID</span>
                                                <p className="font-mono font-medium text-gray-900 text-base print:text-sm">{familyTree.hof.nationalId}</p>
                                            </div>
                                            <div className="border-l-2 border-blue-400 pl-3 print:border-l-0 print:pl-0 print:border-b print:border-gray-400 print:pb-1">
                                                <span className="text-gray-500 block mb-1 print:text-gray-900 print:font-bold uppercase text-xs">Date of Birth</span>
                                                <p className="font-medium text-gray-900 text-base print:text-sm">{formatDate(familyTree.hof.dateOfBirth)}</p>
                                            </div>
                                            <div className="border-l-2 border-blue-400 pl-3 print:border-l-0 print:pl-0 print:border-b print:border-gray-400 print:pb-1">
                                                <span className="text-gray-500 block mb-1 print:text-gray-900 print:font-bold uppercase text-xs">Age</span>
                                                <p className="font-medium text-gray-900 text-base print:text-sm">
                                                    {calculateAge(familyTree.hof.dateOfBirth) !== null 
                                                        ? `${calculateAge(familyTree.hof.dateOfBirth)} years`
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                            <div className="border-l-2 border-blue-400 pl-3 print:border-l-0 print:pl-0 print:border-b print:border-gray-400 print:pb-1">
                                                <span className="text-gray-500 block mb-1 print:text-gray-900 print:font-bold uppercase text-xs">Gender</span>
                                                <p className="font-medium text-gray-900 text-base print:text-sm">{familyTree.hof.gender === 'M' ? 'Male' : familyTree.hof.gender === 'F' ? 'Female' : familyTree.hof.gender}</p>
                                            </div>
                                            {familyTree.hof.relationType && (
                                                <div className="border-l-2 border-blue-400 pl-3 print:border-l-0 print:pl-0 print:border-b print:border-gray-400 print:pb-1">
                                                    <span className="text-gray-500 block mb-1 print:text-gray-900 print:font-bold uppercase text-xs">Relation Type</span>
                                                    <p className="font-medium text-gray-900 text-base print:text-sm">{familyTree.hof.relationType}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4 print:hidden">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewMember(familyTree.hof.id)}
                                            title="View Details"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            View
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditMember(familyTree.hof.id)}
                                            title="Edit Details"
                                        >
                                            <Edit2 className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Dependents Section - Formal Format */}
                <div className="print:page-break-inside-avoid">
                    <div className="hidden print:block mb-4">
                        <h3 className="text-2xl font-bold text-gray-900 uppercase border-b-2 border-gray-600 pb-2">Section 2: Dependents</h3>
                        <p className="text-sm text-gray-700 mt-2">Total Dependents: {familyTree.dependents.length}</p>
                    </div>
                    <Card className="print:border print:border-gray-400 print:shadow-none">
                        <CardHeader className="print:pb-2 print:pt-0">
                            <CardTitle className="text-lg flex items-center gap-2 print:text-base print:font-bold">
                                <Users className="h-5 w-5 print:hidden" />
                                Dependents ({familyTree.dependents.length})
                            </CardTitle>
                            <CardDescription className="print:hidden">
                                Family members linked to this Head of Family
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {familyTree.dependents.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg print:py-8 print:border-gray-400">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400 print:hidden" />
                                    <p className="text-lg font-medium text-gray-900 mb-2 print:text-base">No Dependents</p>
                                    <p className="text-sm text-gray-500 print:text-xs">There are no dependents linked to this Head of Family.</p>
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden print:border-gray-400">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="print:bg-gray-200">
                                                <TableRow className="print:border-b-2 print:border-gray-800">
                                                    <TableHead className="print:text-xs print:font-bold print:py-3 print:px-2 text-center border-r print:border-gray-600">#</TableHead>
                                                    <TableHead className="print:text-xs print:font-bold print:py-3 print:px-2 border-r print:border-gray-600">Subscriber ID</TableHead>
                                                    <TableHead className="print:text-xs print:font-bold print:py-3 print:px-2 border-r print:border-gray-600">Full Name (EN)</TableHead>
                                                    <TableHead className="print:text-xs print:font-bold print:py-3 print:px-2 border-r print:border-gray-600">Full Name (AR)</TableHead>
                                                    <TableHead className="print:text-xs print:font-bold print:py-3 print:px-2 border-r print:border-gray-600">National ID</TableHead>
                                                    <TableHead className="print:text-xs print:font-bold print:py-3 print:px-2 border-r print:border-gray-600">Date of Birth</TableHead>
                                                    <TableHead className="print:text-xs print:font-bold print:py-3 print:px-2 border-r print:border-gray-600 text-center">Age</TableHead>
                                                    <TableHead className="print:text-xs print:font-bold print:py-3 print:px-2 border-r print:border-gray-600 text-center">Gender</TableHead>
                                                    <TableHead className="print:text-xs print:font-bold print:py-3 print:px-2">Relation Type</TableHead>
                                                    <TableHead className="text-right print:hidden">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {familyTree.dependents.map((member, index) => {
                                                    const GenderIcon = getGenderIcon(member.gender)
                                                    const RelationIcon = getRelationTypeIcon(member.relationType)
                                                    return (
                                                        <TableRow 
                                                            key={member.id} 
                                                            className="hover:bg-gray-50 print:border-b print:border-gray-400 print:hover:bg-transparent"
                                                        >
                                                            <TableCell className="print:text-xs print:py-2 print:px-2 print:font-medium text-center border-r print:border-gray-400">
                                                                {index + 1}
                                                            </TableCell>
                                                            <TableCell className="font-mono font-bold text-gray-900 print:text-xs print:py-2 print:px-2 border-r print:border-gray-400">
                                                                {member.id}
                                                            </TableCell>
                                                            <TableCell className="print:text-xs print:py-2 print:px-2 border-r print:border-gray-400">
                                                                <div className="flex items-center gap-2">
                                                                    <GenderIcon className="h-5 w-5 text-gray-400 print:hidden" />
                                                                    <p className="font-medium text-gray-900">{member.fullNameEn}</p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="print:text-xs print:py-2 print:px-2 border-r print:border-gray-400" dir="rtl">
                                                                {member.fullNameAr || (
                                                                    <span className="text-gray-400">—</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-sm print:text-xs print:py-2 print:px-2 border-r print:border-gray-400">
                                                                {member.nationalId}
                                                            </TableCell>
                                                            <TableCell className="text-sm print:text-xs print:py-2 print:px-2 border-r print:border-gray-400">
                                                                {formatDate(member.dateOfBirth)}
                                                            </TableCell>
                                                            <TableCell className="text-sm print:text-xs print:py-2 print:px-2 text-center border-r print:border-gray-400">
                                                                {calculateAge(member.dateOfBirth) !== null 
                                                                    ? `${calculateAge(member.dateOfBirth)}`
                                                                    : 'N/A'}
                                                            </TableCell>
                                                            <TableCell className="print:text-xs print:py-2 print:px-2 text-center border-r print:border-gray-400">
                                                                <span className={cn(
                                                                    'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium print:px-1 print:py-0.5',
                                                                    member.gender === 'M' 
                                                                        ? 'bg-blue-100 text-blue-700 print:bg-transparent print:text-gray-900' 
                                                                        : 'bg-pink-100 text-pink-700 print:bg-transparent print:text-gray-900'
                                                                )}>
                                                                    {member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="print:text-xs print:py-2 print:px-2">
                                                                {member.relationType ? (
                                                                    <span className="inline-flex items-center gap-1 text-sm text-gray-600 print:text-xs">
                                                                        <RelationIcon className="h-4 w-4 print:hidden" />
                                                                        {member.relationType}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-sm text-gray-400 print:text-xs">—</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right print:hidden">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleViewMember(member.id)}
                                                                        title="View Details"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleEditMember(member.id)}
                                                                        title="Edit Details"
                                                                    >
                                                                        <Edit2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Official Report Footer - Only visible on print */}
                <div className="hidden print:block mt-8 pt-6 border-t-4 border-gray-800">
                    <div className="text-center space-y-2 mb-4">
                        <div className="text-xs text-gray-700 space-y-1">
                            <p className="font-semibold">DOCUMENT VERIFICATION</p>
                            <p>This is an official TPA (Third Party Administrator) document</p>
                            <p>Report Generated: {currentDate} at {currentTime}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-400 text-xs">
                            <div>
                                <p className="font-semibold mb-2">Total Members</p>
                                <p className="text-lg font-bold">{totalMembers}</p>
                            </div>
                            <div>
                                <p className="font-semibold mb-2">Head of Family</p>
                                <p className="text-lg font-bold">1</p>
                            </div>
                            <div>
                                <p className="font-semibold mb-2">Dependents</p>
                                <p className="text-lg font-bold">{familyTree.dependents.length}</p>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-400 text-xs text-gray-600">
                            <p><strong>End of Report</strong></p>
                            <p className="mt-2">This document is computer-generated and does not require a signature.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

