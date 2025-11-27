import { Subscriber } from '@/types/subscriber'

function formatDate(date: Subscriber['dateOfBirth']): string {
    if (!date) return '-'
    if (Array.isArray(date)) {
        return `${date[2]}/${date[1]}/${date[0]}`
    }
    if (typeof date === 'string') {
        const d = new Date(date)
        return d.toLocaleDateString()
    }
    return '-'
}

function formatTimestamp(timestamp: number | string | null): string {
    if (!timestamp) return '-'
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp)
    return date.toLocaleDateString()
}

function calculateAge(dateOfBirth: Subscriber['dateOfBirth']): number | null {
    if (!dateOfBirth) return null
    let birthDate: Date
    if (Array.isArray(dateOfBirth)) {
        birthDate = new Date(dateOfBirth[0], dateOfBirth[1] - 1, dateOfBirth[2])
    } else if (typeof dateOfBirth === 'string') {
        birthDate = new Date(dateOfBirth)
    } else {
        return null
    }
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }
    return age
}

export function exportSubscriberToPDF(subscriber: Subscriber): void {
    const age = calculateAge(subscriber.dateOfBirth)
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscriber Information - ${subscriber.fullNameEn}</title>
    <style>
        @media print {
            @page {
                size: A4;
                margin: 20mm;
            }
            body {
                margin: 0;
                padding: 0;
            }
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            border-bottom: 3px solid #0066cc;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #0066cc;
            margin: 0;
            font-size: 24px;
        }
        .header .subtitle {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section-title {
            background-color: #f0f0f0;
            padding: 10px;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 15px;
            border-left: 4px solid #0066cc;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        .info-item {
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            color: #555;
            font-size: 12px;
            margin-bottom: 3px;
        }
        .info-value {
            color: #333;
            font-size: 14px;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            margin-left: 5px;
        }
        .badge-hof {
            background-color: #e3f2fd;
            color: #1976d2;
        }
        .badge-dependent {
            background-color: #f3e5f5;
            color: #7b1fa2;
        }
        .badge-alive {
            background-color: #e8f5e9;
            color: #2e7d32;
        }
        .badge-deceased {
            background-color: #ffebee;
            color: #c62828;
        }
        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #666;
        }
        @media print {
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Subscriber Information</h1>
        <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
    </div>

    <div class="section">
        <div class="section-title">Personal Information</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">National ID</div>
                <div class="info-value">${subscriber.nationalId || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Insurance ID</div>
                <div class="info-value">${subscriber.insuranceId || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Full Name (English)</div>
                <div class="info-value">${subscriber.fullNameEn || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Full Name (Arabic)</div>
                <div class="info-value" dir="rtl">${subscriber.fullNameAr || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Gender</div>
                <div class="info-value">
                    ${subscriber.gender === 'M' ? 'Male' : subscriber.gender === 'F' ? 'Female' : subscriber.gender === 'O' ? 'Other' : subscriber.gender || '-'}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Date of Birth</div>
                <div class="info-value">
                    ${formatDate(subscriber.dateOfBirth)}${age !== null ? ` (Age: ${age} years)` : ''}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Marital Status</div>
                <div class="info-value">${subscriber.maritalStatus || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                    <span class="badge ${subscriber.isAlive ? 'badge-alive' : 'badge-deceased'}">
                        ${subscriber.isAlive ? 'Alive' : 'Deceased'}
                    </span>
                    ${subscriber.isHeadOfFamily ? '<span class="badge badge-hof">HOF</span>' : '<span class="badge badge-dependent">Dependent</span>'}
                </div>
            </div>
            ${subscriber.deathDate ? `
            <div class="info-item">
                <div class="info-label">Death Date</div>
                <div class="info-value">${subscriber.deathDate}</div>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Contact Information</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Phone Number</div>
                <div class="info-value">${subscriber.phoneNumber || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Mobile Number</div>
                <div class="info-value">${subscriber.mobileNumber || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${subscriber.email || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Country</div>
                <div class="info-value">${subscriber.country || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">City</div>
                <div class="info-value">${subscriber.city || '-'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Address</div>
                <div class="info-value">${subscriber.addressLine || '-'}</div>
            </div>
        </div>
    </div>

    ${subscriber.employerName || subscriber.employeeNumber ? `
    <div class="section">
        <div class="section-title">Employment Information</div>
        <div class="info-grid">
            ${subscriber.employerName ? `
            <div class="info-item">
                <div class="info-label">Employer Name</div>
                <div class="info-value">${subscriber.employerName}</div>
            </div>
            ` : ''}
            ${subscriber.employeeNumber ? `
            <div class="info-item">
                <div class="info-label">Employee Number</div>
                <div class="info-value">${subscriber.employeeNumber}</div>
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    ${subscriber.hasPreexisting || subscriber.hasChronicConditions ? `
    <div class="section">
        <div class="section-title">Medical Information</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Has Chronic Conditions</div>
                <div class="info-value">${subscriber.hasChronicConditions ? 'Yes' : 'No'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Has Preexisting Conditions</div>
                <div class="info-value">${subscriber.hasPreexisting ? 'Yes' : 'No'}</div>
            </div>
            ${subscriber.preexistingNotes ? `
            <div class="info-item" style="grid-column: 1 / -1;">
                <div class="info-label">Preexisting Notes</div>
                <div class="info-value">${subscriber.preexistingNotes}</div>
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    ${subscriber.eligibilityStatus ? `
    <div class="section">
        <div class="section-title">Eligibility Information</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Eligibility Status</div>
                <div class="info-value">${subscriber.eligibilityStatus}</div>
            </div>
            ${subscriber.eligibilityStart ? `
            <div class="info-item">
                <div class="info-label">Eligibility Start</div>
                <div class="info-value">${subscriber.eligibilityStart}</div>
            </div>
            ` : ''}
            ${subscriber.eligibilityEnd ? `
            <div class="info-item">
                <div class="info-label">Eligibility End</div>
                <div class="info-value">${subscriber.eligibilityEnd}</div>
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <div>Subscriber ID: ${subscriber.id}</div>
        <div>Created: ${formatTimestamp(subscriber.createdAt)} | Updated: ${formatTimestamp(subscriber.updatedAt)}</div>
    </div>

    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>
    `

    // Create a new window with the HTML content
    const printWindow = window.open('', '_blank')
    if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        // Auto-print when window loads
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print()
            }, 250)
        }
    }
}

