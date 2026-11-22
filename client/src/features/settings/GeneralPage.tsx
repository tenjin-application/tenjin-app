import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { del, get, patch, post } from '@/lib/api';
import { useNavigate } from 'react-router-dom';


export default function GeneralPage() {
    const [deleting, setDeleting] = useState(false);
    const [deleteConfim, setDeleteConfirm] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [deleted, setDeleted] = useState(false);

    const handleDelete = () => {
        if (deleteConfim == false) {
            setDeleteConfirm(true);
            return;
        }
        setDeleteConfirm(false);
        setDeleting(true);
        async function deleteAccount() {
            try {
                setStatusMessage(`point`);
                const result = await del("/settings/general");
                
                if (true) {
                    setStatusMessage('User Deleted');
                    setDeleted(true);
                }
            } catch (err) {
                
            } finally {
                setDeleting(false);
            }
        }

        deleteAccount();
        return;
    }

    return (
        <section className="relative flex-1 overflow-y-auto px-6 py-3 space-y-4">
            {/* <Modal
                open={deleted}
                onClose={() => {const nav = useNavigate(); nav('/login')}}
                title='Account deleted'
            >
                <p className="text-sm text-slate-600">
                    Your account has been deleted. You will now be redirected to the login page.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {setDeleted(false)}}
                    >
                        Ok
                    </Button>
                </div>
            </Modal>
            <div>
                <h1 className='text-3xl font-bold tracking-tight text-slate-900'>General Settings</h1>
            </div>
            <div className='w-1/3 space-y-4'>
                <Button variant='primary' type='button' disabled={deleting} onClick={handleDelete} className={'hover:bg-red'}>
                    {deleteConfim ? 'Are you sure?' : deleting ? 'Deleting...' : 'Delete Account'}
                </Button>
            </div>
            {statusMessage && <p>{statusMessage}</p>} */}
        </section>
    )
}