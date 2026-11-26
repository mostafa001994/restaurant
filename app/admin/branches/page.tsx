'use client';

import { useState } from 'react';
import BranchList from '@/components/admin/branch/BranchList';
import BranchFormModal from '@/components/admin/branch/BranchFormModal';
import { Branch } from '@/types/models';

export default function AdminBranchesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | undefined>(undefined);
  const [reloadFlag, setReloadFlag] = useState(false);

  const handleCreate = () => {
    setEditingBranch(undefined);
    setShowModal(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setShowModal(true);
  };

  const handleSaved = () => {
    setReloadFlag(!reloadFlag);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">مدیریت شعب</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          ایجاد شعبه جدید
        </button>
      </div>

      <BranchList key={reloadFlag ? 'reload1' : 'reload2'} onEdit={handleEdit} />

      {showModal && (
        <BranchFormModal
          branch={editingBranch}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}