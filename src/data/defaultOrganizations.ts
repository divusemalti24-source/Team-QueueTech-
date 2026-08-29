import { Organization, QueueToken } from '../types';

export const DEFAULT_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-hospital',
    name: 'City Care Super-Specialty Hospital',
    nameHi: 'सिटी केयर सुपर स्पेशलिटी अस्पताल',
    tagline: 'Universal Public Healthcare & Clinical Diagnostics',
    type: 'hospital',
    logoIcon: 'Activity',
    brandColor: '#0284c7', // Sky Blue
    departments: [
      {
        id: 'dept-opd',
        name: 'OPD General & Consultations',
        nameHi: 'ओपीडी सामान्य परामर्श',
        description: 'Primary medical consultations, triage, and outpatient checkups',
        services: [
          {
            id: 'srv-gen-med',
            deptId: 'dept-opd',
            name: 'General Medicine & Triage',
            nameHi: 'सामान्य चिकित्सा एवं जांच',
            code: 'MED',
            avgServiceTimeMinutes: 6,
            description: 'Routine fever, vitals, general health consultations',
            isActive: true,
            requiresAuth: false,
            color: 'cyan',
            iconName: 'Stethoscope'
          },
          {
            id: 'srv-peds',
            deptId: 'dept-opd',
            name: 'Pediatrics & Child Care',
            nameHi: 'बाल रोग विशेषज्ञ',
            code: 'PED',
            avgServiceTimeMinutes: 8,
            description: 'Infant care, vaccination, and pediatric consultations',
            isActive: true,
            requiresAuth: false,
            color: 'emerald',
            iconName: 'Baby'
          }
        ]
      },
      {
        id: 'dept-diag',
        name: 'Diagnostic Laboratory & Imaging',
        nameHi: 'नैदानिक प्रयोगशाला एवं इमेजिंग',
        description: 'Blood sample collection, X-Ray, ECG, and pathology testing',
        services: [
          {
            id: 'srv-blood-test',
            deptId: 'dept-diag',
            name: 'Blood & Pathology Tests',
            nameHi: 'रक्त एवं पैथोलॉजी परीक्षण',
            code: 'LAB',
            avgServiceTimeMinutes: 4,
            description: 'Sample collection, CBC, lipid profile, rapid blood work',
            isActive: true,
            requiresAuth: false,
            color: 'amber',
            iconName: 'FlaskConical'
          },
          {
            id: 'srv-radiology',
            deptId: 'dept-diag',
            name: 'Digital X-Ray & Ultrasound',
            nameHi: 'डिजिटल एक्स-रे एवं अल्ट्रासाउंड',
            code: 'RAD',
            avgServiceTimeMinutes: 10,
            description: 'Chest X-ray, bone radiography, and sonography',
            isActive: true,
            requiresAuth: false,
            color: 'purple',
            iconName: 'ScanLine'
          }
        ]
      },
      {
        id: 'dept-pharm',
        name: 'Central Pharmacy & Dispensing',
        nameHi: 'केंद्रीय फार्मेसी एवं दवा वितरण',
        description: 'Government subsidized & generic medicine dispensation',
        services: [
          {
            id: 'srv-pharmacy',
            deptId: 'dept-pharm',
            name: 'Prescription Medicine Dispensing',
            nameHi: 'दवा वितरण केंद्र',
            code: 'RX',
            avgServiceTimeMinutes: 3,
            description: 'Medicine counter for doctor prescription fulfillment',
            isActive: true,
            requiresAuth: false,
            color: 'indigo',
            iconName: 'Pill'
          }
        ]
      }
    ],
    counters: [
      {
        id: 'cnt-1',
        number: '1',
        name: 'Counter 1 (General OPD)',
        deptId: 'dept-opd',
        serviceIds: ['srv-gen-med'],
        currentStaffId: 'staff-1',
        currentStaffName: 'Dr. Sharma (Physician)',
        isOnline: true,
        isFlexCounter: false
      },
      {
        id: 'cnt-2',
        number: '2',
        name: 'Counter 2 (Pediatrics)',
        deptId: 'dept-opd',
        serviceIds: ['srv-peds'],
        currentStaffId: 'staff-2',
        currentStaffName: 'Dr. Verma (Pediatrician)',
        isOnline: true,
        isFlexCounter: false
      },
      {
        id: 'cnt-3',
        number: '3',
        name: 'Counter 3 (Blood Sample Lab)',
        deptId: 'dept-diag',
        serviceIds: ['srv-blood-test'],
        currentStaffId: 'staff-3',
        currentStaffName: 'Rajesh Kumar (Lab Tech)',
        isOnline: true,
        isFlexCounter: false
      },
      {
        id: 'cnt-4',
        number: '4',
        name: 'Counter 4 (Pharmacy Counter A)',
        deptId: 'dept-pharm',
        serviceIds: ['srv-pharmacy'],
        currentStaffId: 'staff-4',
        currentStaffName: 'Sunita Patel (Pharmacist)',
        isOnline: true,
        isFlexCounter: false
      },
      {
        id: 'cnt-5',
        number: '5',
        name: 'Counter 5 (Flex Load Balancer)',
        deptId: 'dept-opd',
        serviceIds: ['srv-gen-med', 'srv-blood-test'],
        isOnline: false,
        isFlexCounter: true
      }
    ],
    rules: {
      allowGuestAccess: true,
      requirePhoneForDigital: true,
      graceHoldMinutes: 5,
      enableStaggeredArrival: true,
      enableVoiceAnnouncements: true,
      maxActiveTokensPerUser: 5,
      tokenCooldownMinutes: 30,
      showQueuePosition: true,
      showPeopleAhead: true,
      showEstimatedTime: false,
      showCounter: true,
      showServiceStatus: true,
      priorityWeights: {
        emergency: 100,
        differently_abled: 50,
        senior: 30,
        standard: 10
      }
    },
    integrations: {
      sms: { enabled: true, provider: 'Twilio / NIC SMS Gateway', status: 'unconfigured' },
      whatsapp: { enabled: true, provider: 'Meta Cloud API', status: 'unconfigured' },
      email: { enabled: true, provider: 'SMTP / SendGrid', status: 'unconfigured' },
      thermalPrinter: { enabled: true, status: 'configured' },
      webhooks: { enabled: false, status: 'unconfigured' }
    }
  },

  {
    id: 'org-civic',
    name: 'Metropolitan Civic & Transport Centre',
    nameHi: 'महानगरीय नागरिक एवं परिवहन केंद्र',
    tagline: 'Public Grievance, Licensing, Property & Land Registration',
    type: 'government',
    logoIcon: 'Landmark',
    brandColor: '#4f46e5', // Indigo
    departments: [
      {
        id: 'dept-rto',
        name: 'Transport & Driving License Bureau',
        nameHi: 'परिवहन एवं ड्राइविंग लाइसेंस ब्यूरो',
        description: 'Learner permits, driving test slots, and vehicle registration',
        services: [
          {
            id: 'srv-license',
            deptId: 'dept-rto',
            name: 'Driving License Issue & Renewal',
            nameHi: 'ड्राइविंग लाइसेंस जारी/नवीनीकरण',
            code: 'DL',
            avgServiceTimeMinutes: 7,
            description: 'Biometric capture, document verification, smart card issuance',
            isActive: true,
            requiresAuth: false,
            color: 'indigo',
            iconName: 'CreditCard'
          },
          {
            id: 'srv-rc',
            deptId: 'dept-rto',
            name: 'Vehicle RC & Ownership Transfer',
            nameHi: 'वाहन आरसी एवं स्वामित्व हस्तांतरण',
            code: 'RC',
            avgServiceTimeMinutes: 6,
            description: 'Fitness certification, hypothecation cancellation, RC card',
            isActive: true,
            requiresAuth: false,
            color: 'blue',
            iconName: 'Car'
          }
        ]
      },
      {
        id: 'dept-records',
        name: 'Land Revenue & Citizen Certificates',
        nameHi: 'भू-राजस्व एवं नागरिक प्रमाण पत्र',
        description: 'Income certificates, caste validation, and mutation entries',
        services: [
          {
            id: 'srv-cert',
            deptId: 'dept-records',
            name: 'Domicile & Income Certificate',
            nameHi: 'मूल निवास एवं आय प्रमाण पत्र',
            code: 'CRT',
            avgServiceTimeMinutes: 5,
            description: 'Submission and instant seal verification for civic certificates',
            isActive: true,
            requiresAuth: false,
            color: 'emerald',
            iconName: 'FileCheck'
          }
        ]
      }
    ],
    counters: [
      {
        id: 'civic-cnt-1',
        number: '1',
        name: 'Counter 1 (License Verification)',
        deptId: 'dept-rto',
        serviceIds: ['srv-license'],
        currentStaffId: 'staff-civic-1',
        currentStaffName: 'Anil Mehra (Superintendent)',
        isOnline: true,
        isFlexCounter: false
      },
      {
        id: 'civic-cnt-2',
        number: '2',
        name: 'Counter 2 (Vehicle Registration)',
        deptId: 'dept-rto',
        serviceIds: ['srv-rc'],
        currentStaffId: 'staff-civic-2',
        currentStaffName: 'Priya Nair (Inspector)',
        isOnline: true,
        isFlexCounter: false
      },
      {
        id: 'civic-cnt-3',
        number: '3',
        name: 'Counter 3 (Certificates & Seals)',
        deptId: 'dept-records',
        serviceIds: ['srv-cert'],
        currentStaffId: 'staff-civic-3',
        currentStaffName: 'Kavita Joshi (Officer)',
        isOnline: true,
        isFlexCounter: false
      }
    ],
    rules: {
      allowGuestAccess: true,
      requirePhoneForDigital: true,
      graceHoldMinutes: 5,
      enableStaggeredArrival: true,
      enableVoiceAnnouncements: true,
      maxActiveTokensPerUser: 5,
      tokenCooldownMinutes: 30,
      showQueuePosition: true,
      showPeopleAhead: true,
      showEstimatedTime: false,
      showCounter: true,
      showServiceStatus: true,
      priorityWeights: {
        emergency: 100,
        differently_abled: 50,
        senior: 35,
        standard: 10
      }
    },
    integrations: {
      sms: { enabled: true, provider: 'NIC Government SMS', status: 'unconfigured' },
      whatsapp: { enabled: false, provider: '', status: 'unconfigured' },
      email: { enabled: true, provider: 'GovMail SMTP', status: 'unconfigured' },
      thermalPrinter: { enabled: true, status: 'configured' },
      webhooks: { enabled: false, status: 'unconfigured' }
    }
  },

  {
    id: 'org-bank',
    name: 'Apex National Commercial Bank',
    nameHi: 'एपेक्स नेशनल कमर्शियल बैंक',
    tagline: 'Retail Banking, Foreign Exchange, Mortgages & NRI Services',
    type: 'bank',
    logoIcon: 'Building2',
    brandColor: '#059669', // Emerald
    departments: [
      {
        id: 'dept-cash',
        name: 'Cash & Forex Counter',
        nameHi: 'रोकड़ एवं विदेशी मुद्रा पटल',
        description: 'Deposits, withdrawals, demand drafts, and currency exchange',
        services: [
          {
            id: 'srv-cash-dep',
            deptId: 'dept-cash',
            name: 'Cash Deposits & Currency Exchange',
            nameHi: 'नकद जमा एवं मुद्रा विनिमय',
            code: 'CSH',
            avgServiceTimeMinutes: 4,
            description: 'Counter for bulk cash, traveler checks, draft clearance',
            isActive: true,
            requiresAuth: false,
            color: 'emerald',
            iconName: 'Banknote'
          }
        ]
      },
      {
        id: 'dept-loans',
        name: 'Loans, Mortgages & KYC Helpdesk',
        nameHi: 'ऋण, बंधक एवं केवाईसी हेल्पडेस्क',
        description: 'Home loan appraisal, vehicle loan, re-KYC, and wealth advisory',
        services: [
          {
            id: 'srv-loan-adv',
            deptId: 'dept-loans',
            name: 'Home & SME Loan Advisory',
            nameHi: 'गृह एवं व्यापार ऋण परामर्श',
            code: 'LON',
            avgServiceTimeMinutes: 12,
            description: 'Documentation, sanction letters, collateral verification',
            isActive: true,
            requiresAuth: false,
            color: 'indigo',
            iconName: 'BadgePercent'
          },
          {
            id: 'srv-kyc',
            deptId: 'dept-loans',
            name: 'Account Opening & KYC Update',
            nameHi: 'खाता खोलना एवं केवाईसी अपडेट',
            code: 'KYC',
            avgServiceTimeMinutes: 6,
            description: 'Biometric re-KYC, signature update, internet banking setup',
            isActive: true,
            requiresAuth: false,
            color: 'blue',
            iconName: 'UserCheck'
          }
        ]
      }
    ],
    counters: [
      {
        id: 'bank-cnt-1',
        number: '1',
        name: 'Teller 1 (Cash & Deposits)',
        deptId: 'dept-cash',
        serviceIds: ['srv-cash-dep'],
        currentStaffId: 'staff-bank-1',
        currentStaffName: 'Vikram Sengupta (Head Cashier)',
        isOnline: true,
        isFlexCounter: false
      },
      {
        id: 'bank-cnt-2',
        number: '2',
        name: 'Counter 2 (Loans & Advances)',
        deptId: 'dept-loans',
        serviceIds: ['srv-loan-adv'],
        currentStaffId: 'staff-bank-2',
        currentStaffName: 'Deepa Menon (Loan Manager)',
        isOnline: true,
        isFlexCounter: false
      },
      {
        id: 'bank-cnt-3',
        number: '3',
        name: 'Counter 3 (KYC & Account Desk)',
        deptId: 'dept-loans',
        serviceIds: ['srv-kyc'],
        currentStaffId: 'staff-bank-3',
        currentStaffName: 'Rahul Ahuja (Customer Relations)',
        isOnline: true,
        isFlexCounter: false
      }
    ],
    rules: {
      allowGuestAccess: true,
      requirePhoneForDigital: true,
      graceHoldMinutes: 5,
      enableStaggeredArrival: true,
      enableVoiceAnnouncements: true,
      maxActiveTokensPerUser: 5,
      tokenCooldownMinutes: 30,
      showQueuePosition: true,
      showPeopleAhead: true,
      showEstimatedTime: false,
      showCounter: true,
      showServiceStatus: true,
      priorityWeights: {
        emergency: 100,
        differently_abled: 60,
        senior: 50,
        standard: 10
      }
    },
    integrations: {
      sms: { enabled: true, provider: 'Bank Secured SMS Gateway', status: 'unconfigured' },
      whatsapp: { enabled: true, provider: 'Bank Bot', status: 'unconfigured' },
      email: { enabled: true, provider: 'Bank SMTP', status: 'unconfigured' },
      thermalPrinter: { enabled: true, status: 'configured' },
      webhooks: { enabled: false, status: 'unconfigured' }
    }
  },

  {
    id: 'org-univ',
    name: 'State Central Polytechnic & University',
    nameHi: 'राज्य केंद्रीय विश्वविद्यालय एवं पॉलिटेक्निक',
    tagline: 'Admissions, Examination Cell, Fee Counter & Student Welfare',
    type: 'university',
    logoIcon: 'GraduationCap',
    brandColor: '#d97706', // Amber
    departments: [
      {
        id: 'dept-admissions',
        name: 'Admissions & Counseling',
        nameHi: 'प्रवेश एवं परामर्श पटल',
        description: 'Seat allotment, merit verification, and document submission',
        services: [
          {
            id: 'srv-admission',
            deptId: 'dept-admissions',
            name: 'Document Verification & Seat Allotment',
            nameHi: 'दस्तावेज़ सत्यापन एवं सीट आवंटन',
            code: 'ADM',
            avgServiceTimeMinutes: 8,
            description: 'Original certificate validation, rank counseling, admission pass',
            isActive: true,
            requiresAuth: false,
            color: 'amber',
            iconName: 'GraduationCap'
          }
        ]
      },
      {
        id: 'dept-exam',
        name: 'Examination Cell & Transcripts',
        nameHi: 'परीक्षा प्रकोष्ठ एवं अंकतालिका',
        description: 'Degree certificates, transcripts, and re-evaluation applications',
        services: [
          {
            id: 'srv-transcripts',
            deptId: 'dept-exam',
            name: 'Degree & Transcript Dispatch',
            nameHi: 'डिग्री एवं अंकतालिका वितरण',
            code: 'EXM',
            avgServiceTimeMinutes: 5,
            description: 'Duplicate marksheets, provisional degrees, migration certificates',
            isActive: true,
            requiresAuth: false,
            color: 'purple',
            iconName: 'FileText'
          }
        ]
      }
    ],
    counters: [
      {
        id: 'univ-cnt-1',
        number: '1',
        name: 'Window 1 (Admissions & Verification)',
        deptId: 'dept-admissions',
        serviceIds: ['srv-admission'],
        currentStaffId: 'staff-univ-1',
        currentStaffName: 'Prof. S. K. Bose',
        isOnline: true,
        isFlexCounter: false
      },
      {
        id: 'univ-cnt-2',
        number: '2',
        name: 'Window 2 (Examination Cell)',
        deptId: 'dept-exam',
        serviceIds: ['srv-transcripts'],
        currentStaffId: 'staff-univ-2',
        currentStaffName: 'M. Raman (Assistant Registrar)',
        isOnline: true,
        isFlexCounter: false
      }
    ],
    rules: {
      allowGuestAccess: true,
      requirePhoneForDigital: true,
      graceHoldMinutes: 5,
      enableStaggeredArrival: true,
      enableVoiceAnnouncements: true,
      maxActiveTokensPerUser: 3,
      tokenCooldownMinutes: 2,
      showQueuePosition: true,
      showPeopleAhead: true,
      showEstimatedTime: false,
      showCounter: true,
      showServiceStatus: true,
      priorityWeights: {
        emergency: 100,
        differently_abled: 50,
        senior: 30,
        standard: 10
      }
    },
    integrations: {
      sms: { enabled: true, provider: 'Campus SMS Service', status: 'unconfigured' },
      whatsapp: { enabled: false, provider: '', status: 'unconfigured' },
      email: { enabled: true, provider: 'University Mailer', status: 'unconfigured' },
      thermalPrinter: { enabled: true, status: 'configured' },
      webhooks: { enabled: false, status: 'unconfigured' }
    }
  }
];

export const INITIAL_MOCK_TOKENS: QueueToken[] = [
  {
    id: 'tok-101',
    tokenNumber: 'MED-101',
    secureTrackingRef: 'TRK-9F8A-2B11',
    orgId: 'org-hospital',
    deptId: 'dept-opd',
    deptName: 'OPD General & Consultations',
    serviceId: 'srv-gen-med',
    serviceName: 'General Medicine & Triage',
    serviceNameHi: 'सामान्य चिकित्सा एवं जांच',
    citizenName: 'Rameshwar Lal',
    citizenPhone: '9876543210',
    type: 'PHYSICAL_KIOSK',
    priority: 'senior',
    status: 'IN_SERVICE',
    counterId: 'cnt-1',
    counterNumber: '1',
    staffName: 'Dr. Sharma (Physician)',
    issuedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    calledAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    serviceStartedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 0,
    checkInStatus: 'CHECKED_IN_ENTRANCE'
  },
  {
    id: 'tok-102',
    tokenNumber: 'MED-102',
    secureTrackingRef: 'TRK-7E3D-94C2',
    orgId: 'org-hospital',
    deptId: 'dept-opd',
    deptName: 'OPD General & Consultations',
    serviceId: 'srv-gen-med',
    serviceName: 'General Medicine & Triage',
    serviceNameHi: 'सामान्य चिकित्सा एवं जांच',
    citizenName: 'Pooja Sundaram',
    citizenPhone: '9811223344',
    citizenEmail: 'pooja.sundaram@example.com',
    userId: 'usr-pooja-101',
    type: 'DIGITAL',
    priority: 'standard',
    status: 'WAITING',
    issuedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 3,
    checkInStatus: 'CHECKED_IN_ENTRANCE',
    staggeredWindow: {
      recommendedArrival: '10:15 AM',
      windowStart: '10:10 AM',
      windowEnd: '10:25 AM'
    }
  },
  {
    id: 'tok-103',
    tokenNumber: 'MED-103',
    secureTrackingRef: 'TRK-5A1F-8890',
    orgId: 'org-hospital',
    deptId: 'dept-opd',
    deptName: 'OPD General & Consultations',
    serviceId: 'srv-gen-med',
    serviceName: 'General Medicine & Triage',
    serviceNameHi: 'सामान्य चिकित्सा एवं जांच',
    citizenName: 'Amit Trivedi',
    citizenPhone: '9822334455',
    type: 'DIGITAL',
    priority: 'standard',
    status: 'WAITING',
    issuedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 9,
    checkInStatus: 'NOT_ARRIVED'
  },
  {
    id: 'tok-104',
    tokenNumber: 'PED-101',
    secureTrackingRef: 'TRK-2B9C-7411',
    orgId: 'org-hospital',
    deptId: 'dept-opd',
    deptName: 'OPD General & Consultations',
    serviceId: 'srv-peds',
    serviceName: 'Pediatrics & Child Care',
    serviceNameHi: 'बाल रोग विशेषज्ञ',
    citizenName: 'Baby Aarav (Father: Vijay)',
    citizenPhone: '9733445566',
    type: 'PHYSICAL_KIOSK',
    priority: 'standard',
    status: 'CALLED',
    counterId: 'cnt-2',
    counterNumber: '2',
    staffName: 'Dr. Verma (Pediatrician)',
    issuedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    calledAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 0,
    checkInStatus: 'CHECKED_IN_ENTRANCE'
  },
  {
    id: 'tok-105',
    tokenNumber: 'LAB-101',
    secureTrackingRef: 'TRK-4D6E-1982',
    orgId: 'org-hospital',
    deptId: 'dept-diag',
    deptName: 'Diagnostic Laboratory & Imaging',
    serviceId: 'srv-blood-test',
    serviceName: 'Blood & Pathology Tests',
    serviceNameHi: 'रक्त एवं पैथोलॉजी परीक्षण',
    citizenName: 'Sunita Devi',
    citizenPhone: '9644556677',
    type: 'DIGITAL',
    priority: 'differently_abled',
    status: 'WAITING',
    issuedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 4,
    checkInStatus: 'CHECKED_IN_ENTRANCE'
  },
  {
    id: 'tok-past-1',
    tokenNumber: 'BNK-204',
    secureTrackingRef: 'TRK-1A8B-4412',
    orgId: 'org-bank',
    deptId: 'dept-retail-banking',
    deptName: 'Retail & Teller Services',
    serviceId: 'srv-cash-deposit',
    serviceName: 'Cash & Forex Counter',
    serviceNameHi: 'नकद एवं विदेशी मुद्रा काउंटर',
    citizenName: 'Pooja Sundaram',
    citizenPhone: '9811223344',
    citizenEmail: 'pooja.sundaram@example.com',
    userId: 'usr-pooja-101',
    type: 'DIGITAL',
    priority: 'standard',
    status: 'COMPLETED',
    counterId: 'cnt-b1',
    counterNumber: '1',
    staffName: 'A. Singhania',
    issuedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2 + 15 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 0,
    checkInStatus: 'CHECKED_IN_ENTRANCE'
  },
  {
    id: 'tok-past-2',
    tokenNumber: 'CIV-108',
    secureTrackingRef: 'TRK-3C7D-8921',
    orgId: 'org-gov',
    deptId: 'dept-civil-reg',
    deptName: 'Citizen Documentation & Certificates',
    serviceId: 'srv-birth-cert',
    serviceName: 'Birth & Domicile Certificates',
    serviceNameHi: 'जन्म एवं निवास प्रमाण पत्र',
    citizenName: 'Pooja Sundaram',
    citizenPhone: '9811223344',
    citizenEmail: 'pooja.sundaram@example.com',
    userId: 'usr-pooja-101',
    type: 'DIGITAL',
    priority: 'standard',
    status: 'COMPLETED',
    counterId: 'cnt-g1',
    counterNumber: '1',
    staffName: 'Officer R. Verma',
    issuedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 5 + 20 * 60 * 1000).toISOString(),
    estimatedWaitMinutes: 0,
    checkInStatus: 'CHECKED_IN_ENTRANCE'
  }
];

export const INITIAL_MOCK_APPOINTMENTS = [
  {
    id: 'apt-101',
    userId: 'usr-pooja-101',
    orgId: 'org-hospital',
    orgName: 'City Care Super-Specialty Hospital',
    serviceId: 'srv-radiology',
    serviceName: 'Digital X-Ray & Ultrasound',
    scheduledTime: 'Tomorrow at 10:30 AM',
    status: 'CONFIRMED' as const,
    bookingReference: 'APT-HOSP-9421',
    counterEstimated: 'Counter 4',
    notes: 'Please bring doctor prescription and fasting notes if applicable.'
  },
  {
    id: 'apt-102',
    userId: 'usr-pooja-101',
    orgId: 'org-bank',
    orgName: 'Apex National Bank',
    serviceId: 'srv-loans',
    serviceName: 'Personal & Home Loan Advisory',
    scheduledTime: 'Friday at 02:00 PM',
    status: 'SCHEDULED' as const,
    bookingReference: 'APT-BNK-8812',
    counterEstimated: 'Desk 3',
    notes: 'Documentation review for mortgage pre-approval.'
  }
];

export const INITIAL_MOCK_ACTIVITIES = [
  {
    id: 'act-1',
    userId: 'usr-pooja-101',
    timestamp: 'Today at 09:48 AM',
    type: 'TOKEN_CREATED' as const,
    title: 'Digital Token Generated',
    description: 'Booked Token MED-102 for General Medicine & Triage',
    orgName: 'City Care Super-Specialty Hospital'
  },
  {
    id: 'act-2',
    userId: 'usr-pooja-101',
    timestamp: 'Today at 09:55 AM',
    type: 'CHECK_IN' as const,
    title: 'Lobby QR Check-In Verified',
    description: 'Arrival registered at OPD Entrance Scanner',
    orgName: 'City Care Super-Specialty Hospital'
  },
  {
    id: 'act-3',
    userId: 'usr-pooja-101',
    timestamp: '2 days ago',
    type: 'TOKEN_CREATED' as const,
    title: 'Bank Token Completed',
    description: 'Token BNK-204 completed at Cash & Forex Counter',
    orgName: 'Apex National Bank'
  },
  {
    id: 'act-4',
    userId: 'usr-pooja-101',
    timestamp: '5 days ago',
    type: 'TOKEN_CREATED' as const,
    title: 'Municipal Certificate Issued',
    description: 'Token CIV-108 completed for Birth Certificate issuance',
    orgName: 'Municipal Civic Center'
  }
];

export const DEFAULT_STAFF_INVITATIONS = [
  {
    id: 'inv-1',
    code: 'QLESS-STF-8F4K29',
    orgId: 'org-hospital',
    orgName: 'City Care Super-Specialty Hospital',
    role: 'staff' as const,
    intendedEmail: 'dr.anil@hospital.org',
    createdBy: 'Executive Administrator',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    isUsed: false,
    isRevoked: false
  },
  {
    id: 'inv-2',
    code: 'QLESS-SUP-3M7X11',
    orgId: 'org-hospital',
    orgName: 'City Care Super-Specialty Hospital',
    role: 'supervisor' as const,
    createdBy: 'Executive Administrator',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    isUsed: false,
    isRevoked: false
  },
  {
    id: 'inv-expired',
    code: 'QLESS-EXP-000000',
    orgId: 'org-hospital',
    orgName: 'City Care Super-Specialty Hospital',
    role: 'staff' as const,
    createdBy: 'Executive Administrator',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    expiresAt: new Date(Date.now() - 86400000 * 2).toISOString(), // EXPIRED
    isUsed: false,
    isRevoked: false
  },
  {
    id: 'inv-revoked',
    code: 'QLESS-REV-999999',
    orgId: 'org-hospital',
    orgName: 'City Care Super-Specialty Hospital',
    role: 'staff' as const,
    createdBy: 'Executive Administrator',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    isUsed: false,
    isRevoked: true // REVOKED
  }
];
