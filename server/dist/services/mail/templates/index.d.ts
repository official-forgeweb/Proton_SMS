export declare const templates: {
    studentWelcome: (data: {
        name: string;
        email: string;
        proId: string;
        tempPass: string;
    }) => string;
    teacherOnboarding: (data: {
        name: string;
        email: string;
        employeeId: string;
        tempPass: string;
        role: string;
    }) => string;
    coordinatorOnboarding: (data: {
        name: string;
        email: string;
        coordinatorId: string;
        tempPass: string;
    }) => string;
    feeAssigned: (data: {
        name: string;
        amount: number;
        structureName: string;
        installments: Array<{
            date: string;
            amount: number;
        }>;
    }) => string;
    installmentUpdated: (data: {
        name: string;
        amount: number;
        dueDate: string;
    }) => string;
    paymentSuccess: (data: {
        name: string;
        amountPaid: number;
        remainingBalance: number;
        txRef: string;
        date: string;
    }) => string;
    enquiryResolved: (data: {
        name: string;
        subject: string;
        response: string;
    }) => string;
    timetableUpdated: (data: {
        name: string;
        details: string;
        date: string;
    }) => string;
    passwordReset: (data: {
        name: string;
        resetUrl: string;
    }) => string;
};
//# sourceMappingURL=index.d.ts.map