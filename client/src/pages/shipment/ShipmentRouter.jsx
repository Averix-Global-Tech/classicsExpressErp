import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

import ShipmentDashboard from './ShipmentDashboard';
import ShipmentList from './ShipmentList';
import NewShipmentPage from './NewShipmentPage';
import ShipmentDetail from './ShipmentDetail';
import ShipmentReports from './ShipmentReports';
import EditShipmentPage from './EditShipmentPage';

const OPERATOR_ROLES = [
  ROLES.SYSTEM_ADMIN,
  ROLES.ADMIN,
  ROLES.BRANCH_MANAGER,
  ROLES.DISPATCHER,
  ROLES.CUSTOMER_SERVICE,
  ROLES.EMPLOYEE,
];

export default function ShipmentRouter() {
  const { user } = useAuth();
  const isOperator = OPERATOR_ROLES.includes(user?.role);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<ShipmentDashboard />} />
      <Route path="list" element={<ShipmentList />} />
      <Route path="reports" element={<ShipmentReports />} />

      {isOperator && (
        <>
          <Route path="new" element={<NewShipmentPage />} />
          <Route path=":id/edit" element={<EditShipmentPage />} />
        </>
      )}
      
      <Route path=":id" element={<ShipmentDetail />} />

      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
