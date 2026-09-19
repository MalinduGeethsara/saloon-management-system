"use client";

import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, ConfigProvider, Form, Input, Typography, message } from 'antd';
import { CheckCircleFilled, LockOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;
const MIN_LENGTH = 10;

// Shown to a person whose password was handed over (first run, or set by the owner) before anything else opens,
// and to anyone who wants to change their own password later.
export default function ChangePasswordPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [forced, setForced] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [next, setNext] = useState('');
  const [current, setCurrent] = useState('');

  useEffect(() => {
    fetch('/api/auth/change-password', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) { router.replace('/staff-login?callbackUrl=/change-password'); return; }
        setForced(!!d.forced);
        setName(d.name || '');
      })
      .catch(() => setForced(false));
  }, [router]);

  const longEnough = next.length >= MIN_LENGTH;
  const different = next.length > 0 && next !== current;

  const onFinish = async (values: { currentPassword: string; newPassword: string }) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        messageApi.success('Password changed.');
        router.push(data.landing || '/');
        router.refresh();
      } else {
        setError(data.message || 'Could not change the password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/staff-login');
    router.refresh();
  };

  const Rule = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <div className={`flex items-center gap-2 text-sm ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
      {ok ? <CheckCircleFilled /> : <MinusCircleOutlined />} {children}
    </div>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#7C4DFF', borderRadius: 8 } }}>
      {contextHolder}
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F4F0FF] py-10 px-4 sm:px-6 overflow-y-auto">
        <Card style={{ width: '100%', maxWidth: 440, borderRadius: 16, boxShadow: '0 20px 40px #7C4DFF15' }} variant="borderless">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#7C4DFF15] text-[#7C4DFF] text-2xl"><LockOutlined /></div>
            <Title level={3} style={{ margin: 0 }}>{forced ? 'Choose your own password' : 'Change password'}</Title>
            {forced && (
              <Text type="secondary" className="block mt-2">
                {name ? `Welcome, ${name}. ` : ''}The password you were given is only for the first sign-in. Set your own to continue.
              </Text>
            )}
          </div>

          {error && <Alert type="error" showIcon message={error} className="mb-4" />}

          <Form form={form} layout="vertical" size="large" requiredMark={false} onFinish={onFinish} disabled={forced === null}>
            <Form.Item label={forced ? 'Password you were given' : 'Current password'} name="currentPassword" rules={[{ required: true, message: 'Enter your current password' }]}>
              <Input.Password autoComplete="current-password" onChange={(e) => setCurrent(e.target.value)} />
            </Form.Item>
            <Form.Item label="New password" name="newPassword" rules={[{ required: true, message: 'Choose a new password' }, { min: MIN_LENGTH, message: `At least ${MIN_LENGTH} characters` }]}>
              <Input.Password autoComplete="new-password" onChange={(e) => setNext(e.target.value)} />
            </Form.Item>
            <Form.Item
              label="Type the new password again"
              name="confirm"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Type the new password again' },
                ({ getFieldValue }) => ({
                  validator: (_, value) => (!value || getFieldValue('newPassword') === value ? Promise.resolve() : Promise.reject(new Error('The two passwords do not match'))),
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>

            <div className="mb-5 flex flex-col gap-1">
              <Rule ok={longEnough}>At least {MIN_LENGTH} characters</Rule>
              <Rule ok={different}>Different from the current password</Rule>
            </div>

            <Button type="primary" htmlType="submit" block loading={saving} style={{ height: 48, fontWeight: 600 }}>
              {forced ? 'Save and continue' : 'Change password'}
            </Button>
            {forced ? (
              <Button type="link" block onClick={signOut} style={{ marginTop: 8 }}>Sign out</Button>
            ) : (
              <Button type="link" block onClick={() => router.back()} style={{ marginTop: 8 }}>Cancel</Button>
            )}
          </Form>
        </Card>
      </div>
    </ConfigProvider>
  );
}
