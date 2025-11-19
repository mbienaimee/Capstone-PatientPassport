import {
  checkObservationEditAccess,
  canDoctorEditObservation,
  updateMedicationStatusByTime
} from '../observationAccessControl';

describe('observationAccessControl utilities', () => {
  const now = Date.now();

  function hoursAgo(hours: number) {
    return new Date(now - hours * 60 * 60 * 1000).toISOString();
  }

  test('legacy record (no syncDate) is editable', () => {
    const record: any = { _id: 'r1', data: { medicationStatus: 'Active' } };
    const res = checkObservationEditAccess(record);
    expect(res.isEditable).toBe(true);
    expect(res.canEdit).toBe(true);
    expect(res.hoursSinceSync).toBeNull();
    expect(res.medicationStatus).toBe('Active');
  });

  test('<2 hours medication: editable and Active', () => {
    const record: any = { _id: 'r2', type: 'medication', syncDate: hoursAgo(1.5), data: { medicationStatus: 'Active' } };
    const res = checkObservationEditAccess(record);
    expect(res.isEditable).toBe(true);
    expect(res.canEdit).toBe(true);
    expect(parseFloat(res.hoursSinceSync as string)).toBeGreaterThan(1);
    expect(parseFloat(res.hoursSinceSync as string)).toBeLessThan(2);
    expect(res.medicationStatus).toBe('Active');
  });

  test('2-3 hours medication: editable but Past', () => {
    const record: any = { _id: 'r3', type: 'medication', syncDate: hoursAgo(2.5), data: { medicationStatus: 'Active' } };
    const res = checkObservationEditAccess(record);
    expect(res.isEditable).toBe(true);
    expect(res.canEdit).toBe(true);
    expect(parseFloat(res.hoursSinceSync as string)).toBeGreaterThanOrEqual(2);
    expect(parseFloat(res.hoursSinceSync as string)).toBeLessThanOrEqual(3);
    expect(res.medicationStatus).toBe('Past');
  });

  test('>3 hours: not editable and Past for medication', () => {
    const record: any = { _id: 'r4', type: 'medication', syncDate: hoursAgo(4), data: { medicationStatus: 'Active' } };
    const res = checkObservationEditAccess(record);
    expect(res.isEditable).toBe(false);
    expect(res.canEdit).toBe(false);
    expect(parseFloat(res.hoursSinceSync as string)).toBeGreaterThan(3);
    expect(res.medicationStatus).toBe('Past');
  });

  test('canDoctorEditObservation: legacy allows any doctor', () => {
    const record: any = { _id: 'r5' };
    expect(canDoctorEditObservation(record, 'doctor1')).toBe(true);
  });

  test('canDoctorEditObservation: <2h allows any doctor', () => {
    const record: any = { _id: 'r6', syncDate: hoursAgo(1) };
    expect(canDoctorEditObservation(record, 'doctorX')).toBe(true);
  });

  test('canDoctorEditObservation: 2-3h requires editableBy or creator', () => {
    const record: any = {
      _id: 'r7',
      syncDate: hoursAgo(2.5),
      editableBy: ['doc-allowed'],
      createdBy: 'creator-id'
    };
    expect(canDoctorEditObservation(record, 'doc-allowed')).toBe(true);
    expect(canDoctorEditObservation(record, 'creator-id')).toBe(true);
    expect(canDoctorEditObservation(record, 'other-doc')).toBe(false);
  });

  test('canDoctorEditObservation: >3h denies', () => {
    const record: any = { _id: 'r8', syncDate: hoursAgo(5) };
    expect(canDoctorEditObservation(record, 'any-doc')).toBe(false);
  });

  test('updateMedicationStatusByTime: sets to Active when recent', async () => {
    const record: any = {
      _id: 'r9',
      type: 'medication',
      syncDate: hoursAgo(1),
      data: { medicationStatus: 'Past' },
      save: jest.fn().mockImplementation(async function () { return this; })
    };
    const updated = await updateMedicationStatusByTime(record);
    expect(updated).not.toBeNull();
    expect(updated.data.medicationStatus).toBe('Active');
    expect(record.save).toHaveBeenCalled();
  });

  test('updateMedicationStatusByTime: sets to Past when old', async () => {
    const record: any = {
      _id: 'r10',
      type: 'medication',
      syncDate: hoursAgo(3),
      data: { medicationStatus: 'Active' },
      save: jest.fn().mockImplementation(async function () { return this; })
    };
    const updated = await updateMedicationStatusByTime(record);
    expect(updated).not.toBeNull();
    expect(updated.data.medicationStatus).toBe('Past');
    expect(record.save).toHaveBeenCalled();
  });

});
