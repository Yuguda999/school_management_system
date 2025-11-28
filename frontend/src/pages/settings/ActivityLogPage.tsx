import React from 'react';
import PageHeader from '../../components/Layout/PageHeader';
import ActivityLogTable from '../../components/Activity/ActivityLogTable';

const ActivityLogPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Activity Log"
                description="View and audit system activities and events."
            />

            <ActivityLogTable />
        </div>
    );
};

export default ActivityLogPage;
