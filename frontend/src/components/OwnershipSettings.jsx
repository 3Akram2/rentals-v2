import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import NumberInput from './NumberInput';

function OwnershipSettings({ building, onSave, onCancel }) {
  const { t } = useLang();
  const [totalKirats, setTotalKirats] = useState(building.totalKirats || 24);
  const [ownerGroups, setOwnerGroups] = useState(building.ownerGroups || []);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: '', kirats: '', members: [] });
  const [memberForm, setMemberForm] = useState({ name: '', kirats: '' });
  const [editingMemberIndex, setEditingMemberIndex] = useState(null);

  const usedKirats = ownerGroups.reduce((sum, g) => sum + g.kirats, 0);
  const remainingKirats = totalKirats - usedKirats;

  function handleAddGroup() {
    setEditingGroup('new');
    setGroupForm({ name: '', kirats: '', members: [] });
  }

  function handleEditGroup(index) {
    setEditingGroup(index);
    setGroupForm({ ...ownerGroups[index] });
  }

  function handleDeleteGroup(index) {
    if (confirm(t('deleteGroup'))) {
      setOwnerGroups(ownerGroups.filter((_, i) => i !== index));
    }
  }

  function handleSaveGroup() {
    if (!groupForm.name || !groupForm.kirats) return;

    const group = {
      ...groupForm,
      kirats: Number(groupForm.kirats)
    };

    if (editingGroup === 'new') {
      setOwnerGroups([...ownerGroups, group]);
    } else {
      const updated = [...ownerGroups];
      updated[editingGroup] = group;
      setOwnerGroups(updated);
    }
    setEditingGroup(null);
    setGroupForm({ name: '', kirats: '', members: [] });
  }

  function handleAddMember() {
    if (!memberForm.name || !memberForm.kirats) return;

    if (editingMemberIndex !== null) {
      // Editing existing member
      const updatedMembers = [...groupForm.members];
      updatedMembers[editingMemberIndex] = { name: memberForm.name, kirats: Number(memberForm.kirats) };
      setGroupForm({ ...groupForm, members: updatedMembers });
      setEditingMemberIndex(null);
    } else {
      // Adding new member
      setGroupForm({
        ...groupForm,
        members: [...groupForm.members, { name: memberForm.name, kirats: Number(memberForm.kirats) }]
      });
    }
    setMemberForm({ name: '', kirats: '' });
  }

  function handleEditMember(index) {
    const member = groupForm.members[index];
    setMemberForm({ name: member.name, kirats: member.kirats.toString() });
    setEditingMemberIndex(index);
  }

  function handleCancelEditMember() {
    setMemberForm({ name: '', kirats: '' });
    setEditingMemberIndex(null);
  }

  function handleRemoveMember(index) {
    setGroupForm({
      ...groupForm,
      members: groupForm.members.filter((_, i) => i !== index)
    });
    if (editingMemberIndex === index) {
      setEditingMemberIndex(null);
      setMemberForm({ name: '', kirats: '' });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      totalKirats,
      ownerGroups
    });
  }

  const groupMembersTotal = groupForm.members.reduce((sum, m) => sum + m.kirats, 0);

  return (
    <div className="ownership-settings">
      <div className="form-group">
        <label>{t('totalKirats')}</label>
        <select value={totalKirats} onChange={e => setTotalKirats(Number(e.target.value))}>
          <option value={22}>22 {t('kirats')}</option>
          <option value={24}>24 {t('kirats')}</option>
        </select>
      </div>

      <div className="ownership-summary">
        <span>{t('used')}: {usedKirats} / {totalKirats} {t('kirats')}</span>
        {remainingKirats > 0 && (
          <span className="remaining">({t('remaining')}: {remainingKirats})</span>
        )}
      </div>

      {editingGroup !== null ? (
        <div className="group-editor">
          <h4>{editingGroup === 'new' ? t('addGroup') : t('editGroup')}</h4>

          <div className="form-row">
            <div className="form-group">
              <label>{t('groupName')}</label>
              <input
                type="text"
                value={groupForm.name}
                onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                placeholder={t('groupNamePlaceholder')}
              />
            </div>
            <div className="form-group">
              <label>{t('groupKirats')}</label>
              <NumberInput
                value={groupForm.kirats}
                onChange={e => setGroupForm({ ...groupForm, kirats: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="members-section">
            <h5>{t('members')}</h5>

            {groupForm.members.length > 0 && (
              <div className="members-list">
                {groupForm.members.map((member, i) => (
                  <div key={i} className={`member-item ${editingMemberIndex === i ? 'editing' : ''}`}>
                    <span>{member.name} ({member.kirats} {t('kirats')})</span>
                    <div className="member-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => handleEditMember(i)}
                      >
                        {t('edit')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        onClick={() => handleRemoveMember(i)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                <div className="members-total">
                  {t('membersTotal')}: {groupMembersTotal} / {groupForm.kirats || 0} {t('kirats')}
                </div>
              </div>
            )}

            <div className="add-member-form">
              <input
                type="text"
                value={memberForm.name}
                onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                placeholder={t('memberName')}
              />
              <NumberInput
                value={memberForm.kirats}
                onChange={e => setMemberForm({ ...memberForm, kirats: e.target.value })}
                placeholder={t('kirats')}
              />
              <button type="button" className="btn btn-primary" onClick={handleAddMember}>
                {editingMemberIndex !== null ? t('update') : t('addMember')}
              </button>
              {editingMemberIndex !== null && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEditMember}>
                  {t('cancel')}
                </button>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={handleSaveGroup}>
              {t('saveGroup')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingGroup(null)}>
              {t('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="section-header">
            <h4>{t('ownerGroups')}</h4>
            <button className="btn btn-primary btn-small" onClick={handleAddGroup}>
              {t('addGroup')}
            </button>
          </div>

          {ownerGroups.length === 0 ? (
            <p className="no-groups">{t('noOwnerGroups')}</p>
          ) : (
            <div className="owner-groups-list">
              {ownerGroups.map((group, i) => (
                <div key={i} className="owner-group-card">
                  <div className="owner-group-header">
                    <div>
                      <strong>{group.name}</strong>
                      <span className="group-kirats">{group.kirats} {t('kirats')}</span>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-secondary btn-small" onClick={() => handleEditGroup(i)}>
                        {t('edit')}
                      </button>
                      <button className="btn btn-danger btn-small" onClick={() => handleDeleteGroup(i)}>
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                  {group.members.length > 0 && (
                    <div className="owner-group-members">
                      {group.members.map((m, j) => (
                        <span key={j} className="member-tag">
                          {m.name} ({m.kirats})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSubmit}>
              {t('save')}
            </button>
            <button className="btn btn-secondary" onClick={onCancel}>
              {t('cancel')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default OwnershipSettings;
