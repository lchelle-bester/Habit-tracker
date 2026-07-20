import { useRef, useState } from 'react';
import { useData } from '../../storage/DataContext';
import type { Goal } from '../../types';
import { describeSchedule, describeTarget } from '../../engine/describe';
import { currentTarget } from '../../engine/targets';
import { GoalForm } from './GoalForm';
import './Settings.css';

function GoalListItem({ goal, onEdit }: { goal: Goal; onEdit: (g: Goal) => void }) {
  const { archive, reactivate } = useData();
  const target = currentTarget(goal);
  return (
    <div className="settings-row">
      <div className="settings-row-main">
        <div className="settings-row-name">{goal.name}</div>
        <div className="settings-row-sub num">
          {describeSchedule(goal.schedule)} · {describeTarget(target)}
        </div>
      </div>
      <div className="settings-row-actions">
        <button className="control-text" onClick={() => onEdit(goal)}>
          edit
        </button>
        {goal.archived ? (
          <button className="control-text" onClick={() => reactivate(goal.id)}>
            reactivate
          </button>
        ) : (
          <button className="control-text" onClick={() => archive(goal.id)}>
            archive
          </button>
        )}
      </div>
    </div>
  );
}

export function SettingsView() {
  const { goals, doExport, doImport } = useData();
  const [editing, setEditing] = useState<Goal | 'new' | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const active = goals.filter((g) => !g.archived);
  const archived = goals.filter((g) => g.archived);

  if (editing) {
    return (
      <div className="settings-view">
        <h2 className="settings-heading">{editing === 'new' ? 'New goal' : `Edit ${editing.name}`}</h2>
        <GoalForm goal={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      </div>
    );
  }

  return (
    <div className="settings-view">
      <div className="settings-section-head">
        <h2 className="settings-heading">Goals</h2>
        <button className="control-text" onClick={() => setEditing('new')}>
          + new goal
        </button>
      </div>
      <div className="settings-list">
        {active.map((g, i) => (
          <div key={g.id}>
            {i > 0 && <hr className="hairline" />}
            <GoalListItem goal={g} onEdit={setEditing} />
          </div>
        ))}
      </div>

      {archived.length > 0 && (
        <>
          <h2 className="settings-heading settings-heading-spaced">Archived</h2>
          <div className="settings-list">
            {archived.map((g, i) => (
              <div key={g.id}>
                {i > 0 && <hr className="hairline" />}
                <GoalListItem goal={g} onEdit={setEditing} />
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="settings-heading settings-heading-spaced">Data</h2>
      <div className="settings-list">
        <div className="settings-row">
          <div className="settings-row-main">
            <div className="settings-row-name">Export</div>
            <div className="settings-row-sub">Download everything as JSON</div>
          </div>
          <div className="settings-row-actions">
            <button className="control-text" onClick={doExport}>
              export
            </button>
          </div>
        </div>
        <hr className="hairline" />
        <div className="settings-row">
          <div className="settings-row-main">
            <div className="settings-row-name">Import</div>
            <div className="settings-row-sub">Replace current data from a file</div>
          </div>
          <div className="settings-row-actions">
            <button className="control-text" onClick={() => fileInput.current?.click()}>
              import
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                try {
                  doImport(text);
                } catch (err) {
                  alert(err instanceof Error ? err.message : 'Import failed.');
                }
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
