"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Select, DatePicker, TimePicker, Button, Input } from 'antd';
import { ClockCircleOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { TextArea } = Input;

interface StaffMember { id: string; name: string; }

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Return false to keep the form open (e.g. the server refused the entry)
  onSave: (record: any) => Promise<boolean | void> | boolean | void;
  staffList: StaffMember[];
  recordToEdit?: any;
}

// Big one-tap choices, so a normal day is entered in a few taps instead of scrolling a tiny clock
const IN_PRESETS = [{ label: '8:00 AM', h: 8 }, { label: '9:00 AM', h: 9 }, { label: '10:00 AM', h: 10 }];
const OUT_PRESETS = [{ label: '5:00 PM', h: 17 }, { label: '6:00 PM', h: 18 }, { label: '7:00 PM', h: 19 }];

const fieldStyle: React.CSSProperties = { width: '100%', height: 52, fontSize: 18 };

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">{icon}{children}</div>;
}

export function ManualAttendanceModal({ isOpen, onClose, onSave, staffList, recordToEdit }: ManualAttendanceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [clockIn, setClockIn] = useState<Dayjs | null>(null);
  const [clockOut, setClockOut] = useState<Dayjs | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !isOpen) return;
    setError('');
    setSaving(false);
    if (recordToEdit) {
      setUserId(recordToEdit.userId);
      setDate(recordToEdit.checkInRaw ? dayjs(recordToEdit.checkInRaw) : dayjs());
      setClockIn(recordToEdit.checkInRaw ? dayjs(recordToEdit.checkInRaw) : null);
      setClockOut(recordToEdit.checkOutRaw ? dayjs(recordToEdit.checkOutRaw) : null);
      setNote('');
    } else {
      setUserId(undefined);
      setDate(dayjs());
      setClockIn(null);
      setClockOut(null);
      setNote('');
    }
  }, [isOpen, recordToEdit, mounted]);

  // A time picked on its own carries today's date: put it on the chosen day
  const onDay = (t: Dayjs | null) => (t ? date.hour(t.hour()).minute(t.minute()).second(0).millisecond(0) : null);
  const preset = (h: number) => onDay(dayjs().hour(h).minute(0));

  const setDay = (d: Dayjs) => {
    setDate(d);
    setClockIn((t) => (t ? d.hour(t.hour()).minute(t.minute()).second(0) : t));
    setClockOut((t) => (t ? d.hour(t.hour()).minute(t.minute()).second(0) : t));
  };

  const dayChips = [
    { label: 'Today', value: dayjs() },
    { label: 'Yesterday', value: dayjs().subtract(1, 'day') },
    { label: dayjs().subtract(2, 'day').format('ddd D MMM'), value: dayjs().subtract(2, 'day') },
  ];

  const handleSave = async () => {
    setError('');
    if (!userId) return setError('Choose the staff member first.');
    const inAt = onDay(clockIn);
    const outAt = onDay(clockOut);
    if (!inAt) return setError('Pick the clock-in time.');
    if (outAt && !outAt.isAfter(inAt)) return setError('Clock-out must be after clock-in.');
    if (inAt.isAfter(dayjs()) || (outAt && outAt.isAfter(dayjs()))) return setError('That time has not happened yet. Pick a time that has already passed.');

    const staff = staffList.find((s) => s.id === userId);
    setSaving(true);
    try {
      const ok = await onSave({
        key: recordToEdit?.key,
        userId,
        name: staff?.name || recordToEdit?.name || 'Unknown',
        clockInRaw: inAt.toISOString(),
        clockOutRaw: outAt ? outAt.toISOString() : null,
        date: date.format('YYYY-MM-DD'),
        note: note.trim(),
      });
      if (ok !== false) onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width="min(600px, 96vw)"
      destroyOnHidden
      title={<span className="text-lg font-extrabold">{recordToEdit ? 'Edit Attendance' : 'Manual Attendance Entry'}</span>}
      styles={{ body: { maxHeight: '80dvh', overflowY: 'auto', paddingTop: 8 } }}
    >
      <div className="flex flex-col gap-5">
        <div>
          <SectionLabel icon={<UserOutlined />}>Who</SectionLabel>
          <Select
            size="large"
            style={{ width: '100%', height: 52 }}
            placeholder="Choose the staff member"
            disabled={!!recordToEdit}
            showSearch
            optionFilterProp="label"
            value={userId}
            onChange={setUserId}
            options={staffList.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>

        <div>
          <SectionLabel icon={<CalendarOutlined />}>Date</SectionLabel>
          {!recordToEdit && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {dayChips.map((chip) => (
                <Button key={chip.label} size="large" style={{ height: 48 }} type={date.isSame(chip.value, 'day') ? 'primary' : 'default'} onClick={() => setDay(chip.value)}>
                  {chip.label}
                </Button>
              ))}
            </div>
          )}
          <DatePicker
            size="large"
            style={fieldStyle}
            value={date}
            allowClear={false}
            inputReadOnly
            format="dddd, D MMMM YYYY"
            disabled={!!recordToEdit}
            disabledDate={(d) => d.isAfter(dayjs(), 'day')}
            onChange={(d) => d && setDay(d)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <SectionLabel icon={<ClockCircleOutlined />}>Clock in</SectionLabel>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {IN_PRESETS.map((p) => (
                <Button key={p.label} size="large" style={{ height: 44 }} type={clockIn && clockIn.hour() === p.h && clockIn.minute() === 0 ? 'primary' : 'default'} onClick={() => setClockIn(preset(p.h))}>
                  {p.label}
                </Button>
              ))}
            </div>
            <TimePicker
              size="large"
              style={fieldStyle}
              use12Hours
              format="h:mm A"
              minuteStep={5}
              inputReadOnly
              needConfirm={false}
              placeholder="Pick a time"
              value={clockIn}
              onChange={(t) => setClockIn(onDay(t))}
            />
          </div>

          <div>
            <SectionLabel icon={<ClockCircleOutlined />}>Clock out <span className="font-normal text-slate-400">(optional)</span></SectionLabel>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {OUT_PRESETS.map((p) => (
                <Button key={p.label} size="large" style={{ height: 44 }} type={clockOut && clockOut.hour() === p.h && clockOut.minute() === 0 ? 'primary' : 'default'} onClick={() => setClockOut(preset(p.h))}>
                  {p.label}
                </Button>
              ))}
            </div>
            <TimePicker
              size="large"
              style={fieldStyle}
              use12Hours
              format="h:mm A"
              minuteStep={5}
              inputReadOnly
              needConfirm={false}
              placeholder="Still working"
              value={clockOut}
              onChange={(t) => setClockOut(onDay(t))}
            />
          </div>
        </div>

        <div>
          <SectionLabel icon={null}>{recordToEdit ? 'Reason for the change' : 'Reason'} <span className="font-normal text-slate-400">(optional)</span></SectionLabel>
          <TextArea rows={2} maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Forgot to scan, fingerprint device was down" style={{ fontSize: 16 }} />
        </div>

        {error && <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button size="large" style={{ height: 52 }} onClick={onClose}>Cancel</Button>
          <Button size="large" type="primary" loading={saving} onClick={handleSave} style={{ height: 52, backgroundColor: '#7C4DFF', fontWeight: 700 }}>
            {recordToEdit ? 'Update Record' : 'Save Record'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
