import React, { useState, useEffect, useCallback } from 'react';
import { authStore } from '../stores/authStore';
import { userTrackerService } from '../api/userTrackerService';
import './DashboardPage.css';

// Import all widgets
import MyProgressWidget from '../components/dashboard/MyProgressWidget';
import ReadyToEvolveWidget from '../components/dashboard/ReadyToEvolveWidget';
import PinnedUnitsWidget from '../components/dashboard/PinnedUnitsWidget';
import EvolutionMaterialsWidget from '../components/dashboard/EvolutionMaterialsWidget';
import CatseyesWidget from '../components/dashboard/CatseyesWidget';
import XpTrackerWidget from '../components/dashboard/XpTrackerWidget';
// Import the new Banner
import UpgradeCTABanner from '../components/dashboard/UpgradeCTABanner.jsx'; 

const DashboardSkeleton = () => <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Dashboard Data...</div>;

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
    
    return (
        <div className="dashboard-container">
            {/* Show Banner only for Guest Users */}
            {isAnonymous && <UpgradeCTABanner />} 

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