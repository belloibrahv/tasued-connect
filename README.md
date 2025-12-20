# TASUED AttendX

A comprehensive real-time attendance management and academic performance tracking system designed specifically for Tai Solarin University of Education.

## Features

- **QR-Based Attendance**: Fast, secure attendance marking using QR codes
- **Real-Time Analytics**: Live dashboards for students, lecturers, and administrators
- **Multi-Role Support**: Dedicated portals for students, lecturers, and admins/HODs
- **Automated Interventions**: Early identification of at-risk students
- **Comprehensive Reporting**: Export attendance data in multiple formats

## Tech Stack

- **Frontend**: Next.js 14.2+ with TypeScript, React 18.3+
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **UI**: shadcn/ui, Radix UI, Tailwind CSS, Framer Motion
- **Analytics**: Recharts
- **State Management**: TanStack Query, Zustand

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
tasued-connect/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utilities and configurations
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
└── public/          # Static assets
```

## Development Team

**CSC 415: Net-Centric Computing**  
**Lecturer**: Dr. Ogunsanwo  
**Session**: 2024/2025

### Team Members

1. RASHEED MALIK AYOMIDE - 20220294267
2. OJO MICHAEL OGO-OLUWAKIITAN - 20220294317
3. ILEMOBAYO ABRAHAM IGBEKELE - 20220294163
4. KAZEEM RAZAQ OLAMIDE - 20220294178
5. OKINO SHEDRACH ABDULAHI - 20220294200
6. PETER EMMANUEL AWODI - 20220294097
7. MAKINDE PELUMI ANUOLUWAPO - 20220294210
8. AUDU UGBEDE PETER - 20220294026
9. NAFIU AYOMIDE RAPHAEL - 20220294262
10. AYOMIDE SAMUEL JOSEPH - 20220294050
11. GBOLAHAN OPEYEMI FALOLA - 20220294102
12. IDOWU RACHEAL OLUWABUSOLA - 20220294063
13. BABATUNDE JOSHUA AYOMIDE - 20220294302
14. EMMANUEL OPEYEMI ALAO - 20220294198
15. ODUNAYA JIMMY OLUWATOBILOBA - 20220294134
16. MUSTAPHA AHMED ADEBAYO - 20220294114
17. OGUNADE KAYODE TIMILEHIN - 20220294308
18. EKUMARO ADEDOYIN EMMANUEL - 20220294291
19. AKINADE RIDWAN DAMILARE - 20220294323
20. OLATUNBOSUN BENJAMIN OPEYEMI - 20220294160

## License

This project is developed for educational purposes at Tai Solarin University of Education.
