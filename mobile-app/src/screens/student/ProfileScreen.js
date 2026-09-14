import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Screen from '../../components/Screen';
import { Card, CardTitle } from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import { studentPortalAPI } from '../../api/student';

export default function StudentProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await studentPortalAPI.me();
    setProfile(res.data.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const classTeacher = profile?.class_teacher;
  const parents = profile?.parents || [];

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Card>
        <CardTitle>Student Info</CardTitle>
        <InfoRow label="Name" value={profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()} />
        <InfoRow label="Admission No" value={profile?.admission_no} />
        <InfoRow label="Roll No" value={profile?.roll_no} />
        <InfoRow label="Class" value={profile?.current_class?.name} />
        <InfoRow label="Section" value={profile?.current_section?.name} />
      </Card>

      {classTeacher && (
        <Card>
          <CardTitle>Class Teacher</CardTitle>
          <InfoRow label="Name" value={classTeacher.name} />
          <InfoRow label="Phone" value={classTeacher.phone} />
          <InfoRow label="Email" value={classTeacher.email} />
        </Card>
      )}

      {parents.map((parent, idx) => (
        <Card key={idx}>
          <CardTitle>{parent.relation || 'Parent'}</CardTitle>
          <InfoRow label="Name" value={parent.name} />
          <InfoRow label="Phone" value={parent.phone} />
          <InfoRow label="Email" value={parent.email} />
          <InfoRow label="Occupation" value={parent.occupation} />
        </Card>
      ))}
    </Screen>
  );
}
