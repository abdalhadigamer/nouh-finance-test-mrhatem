
import { ActivityLog, User, UserRole } from '../types';
import { MOCK_ACTIVITY_LOGS } from '../constants';

// In a real app, this would send an API request to the backend.
// Here we are pushing to the mock array.

export const logActivity = (
    user: User, 
    action: ActivityLog['action'], 
    entity: ActivityLog['entity'], 
    description: string, 
    entityId?: string
) => {
    const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: action,
        entity: entity,
        entityId: entityId,
        description: description,
        timestamp: new Date().toISOString()
    };

    // Push to the beginning of the array
    MOCK_ACTIVITY_LOGS.unshift(newLog);
    
    console.log(`[AUDIT] ${user.name} performed ${action} on ${entity}: ${description}`);
};

export const getLogs = async (): Promise<ActivityLog[]> => {
    return new Promise((resolve) => {
        // Simulate network delay
        setTimeout(() => {
            resolve(MOCK_ACTIVITY_LOGS);
        }, 300);
    });
};
