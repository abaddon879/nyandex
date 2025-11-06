import React, { useState, useEffect, useCallback } from 'react';
import { authStore } from '../stores/authStore';
import { userTrackerService } from '../api/userTrackerService';
import './DashboardPage.css'; // We already have this

// Import all 6 widget components
import MyProgressWidget from '../components/dashboard/MyProgressWidget';
import ReadyToEvolveWidget from '../components/dashboard/ReadyToEvolveWidget';
import PinnedUnitsWidget from '../components/dashboard/PinnedUnitsWidget';
import EvolutionMaterialsWidget from '../components/dashboard/EvolutionMaterialsWidget';
import CatseyesWidget from '../components/dashboard/CatseyesWidget';
import XpTrackerWidget from '../components/dashboard/XpTrackerWidget';

// Placeholders
const UpgradeCTABanner = () => <div style={{padding: '1rem', background: '#eee', marginBottom: '1rem'}}>[Upgrade CTA Banner]</div>;
const DashboardSkeleton = () => <div>Loading Dashboard Data...</div>;


function DashboardPage() {
    const [authState, setAuthState] = useState(authStore.getState());
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = authStore.subscribe(setAuthState);
        return unsubscribe;
    }, []);

    const { userId, isAnonymous } = authState;

    const fetchDashboardData = useCallback(async () => {
        if (!userId) return; 
        setIsLoading(true);
        setError(null);
        try {
            const data = await userTrackerService.getDashboardData(userId);
            setDashboardData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchDashboardData();
        }
    }, [userId, fetchDashboardData]);

    if (!userId) {
        return <p>Initializing session...</p>; 
    }
    
    // [THE FIX] Removed the extra wrapper div. 
    // The .page-content class from index.css will handle padding and scrolling.
    return (
        <div className="dashboard-container">
            {isAnonymous && <UpgradeCTABanner />} 

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{margin: 0}}>Dashboard</h1>
                <button onClick={fetchDashboardData} disabled={isLoading} className="btn btn-secondary">
                    {isLoading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

            {isLoading && <DashboardSkeleton />} 
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}

            {!isLoading && dashboardData && (
                <div className="dashboard-grid">
                    <MyProgressWidget data={dashboardData.my_progress} />
                    <ReadyToEvolveWidget data={dashboardData.ready_to_evolve} />
                    <PinnedUnitsWidget data={dashboardData.pinned_units} />
                    <EvolutionMaterialsWidget data={dashboardData.evolution_materials} />
                    <CatseyesWidget data={dashboardData.catseyes} />
                    <XpTrackerWidget data={dashboardData.xp_tracker} />
                </div>
            )}
        </div>
    );
}

export default DashboardPage;