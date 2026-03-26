"use client"

// React component'da ishlatish
import { useEffect, useState } from 'react';
import { getUserInfo } from '@/lib/api/get-user';
import { Button } from './ui/button';

export default function UserProfile() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const data = await getUserInfo();
                if (data.success) {
                    setUser(data.user);
                }
            } catch (err: any) {
                setError(err?.toJSON ? err.toJSON() : err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserInfo();
    }, []);

    if (loading) return <p>Yuklanmoqda...</p>;
    if (error) return <pre>{JSON.stringify(error, null, 2)}</pre>;


    return (
        <div>
            <h1>{user?.firstName}</h1>
            <p>ID: {user?.id}</p>
            <h2>sss</h2>

            <Button onClick={() => setOpen(!open)}>
                {"KATEGORIYA QO'SHISH"}
            </Button>
            {/* <pre>
                {JSON.stringify(user, null, 2)}
            </pre> */}
        </div>
    );
}